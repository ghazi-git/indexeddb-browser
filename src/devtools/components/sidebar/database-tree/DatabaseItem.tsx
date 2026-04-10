import { ContextMenu } from "@kobalte/core/context-menu";
import {
  createMemo,
  createSignal,
  For,
  JSX,
  onMount,
  Show,
  splitProps,
} from "solid-js";

import MenuContent from "@/devtools/components/context-menu/MenuContent";
import ModalTriggerMenuItem from "@/devtools/components/context-menu/ModalTriggerMenuItem";
import {
  Database,
  useDatabaseTreeContext,
} from "@/devtools/components/sidebar/database-tree/database-tree-context";
import { useDeleteDatabaseContext } from "@/devtools/components/sidebar/database-tree/delete-database-context";
import ObjectStoreItem from "@/devtools/components/sidebar/database-tree/ObjectStoreItem";
import SingleLineText from "@/devtools/components/SingleLineText";
import TriangleIcon from "@/devtools/components/svg-icons/TriangleIcon";

import styles from "./DatabaseItem.module.css";

export default function DatabaseItem(props: DatabaseItemProps) {
  const [local, rest] = splitProps(props, ["class", "db", "dbIndex"]);
  const { tree, setSelectedItem, toggleExpandedDatabase, setRefs, focusItem } =
    useDatabaseTreeContext();
  const tabindex = createMemo(() => {
    const [focusableDBIndex, focusableStoreIndex] = tree.focusableItem;
    return focusableDBIndex === local.dbIndex &&
      focusableStoreIndex === undefined
      ? 0
      : -1;
  });
  const isSelected = createMemo(() => {
    return (
      !!tree.selectedItem &&
      tree.selectedItem[0] === local.dbIndex &&
      tree.selectedItem[1] === undefined
    );
  });
  const hasStores = () => !!local.db.objectStores.length;

  let dbRef!: HTMLLIElement;
  const storeRefs: HTMLLIElement[] = [];
  onMount(() => {
    setRefs(local.dbIndex, dbRef, storeRefs);
  });

  const { deleteDBMutation, setDBToDelete } = useDeleteDatabaseContext();
  const [open, setOpen] = createSignal(false);
  let contextMenuTrigger: HTMLDivElement;

  return (
    <li
      ref={dbRef}
      class={`${styles["database-item"]} ${local.class ?? ""}`}
      aria-selected={isSelected()}
      aria-expanded={hasStores() ? local.db.isExpanded : undefined}
      tabindex={tabindex()}
      role="treeitem"
      onKeyDown={(event) => {
        if (hasStores()) {
          if (event.key === "ArrowRight") {
            if (local.db.isExpanded) {
              focusItem(local.dbIndex, 0);
            } else {
              toggleExpandedDatabase(local.dbIndex);
            }
          } else if (event.key === "ArrowLeft" && local.db.isExpanded) {
            toggleExpandedDatabase(local.dbIndex);
          } else if (event.key === "Enter") {
            setSelectedItem(local.dbIndex);
          }
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        // forward the event to the element under the `ContextMenu.Trigger`
        // this is needed for keyboard navigation since this is the element
        // whose tabindex is set
        const customEvent = new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 2,
          clientY: event.clientY,
          clientX: event.clientX,
        });
        contextMenuTrigger.dispatchEvent(customEvent);
      }}
      {...rest}
    >
      <ContextMenu
        // @ts-expect-error open is not part of ContextMenu props, but it is
        // possible to pass it since ContextMenu and DropdownMenu use the same
        // underlying Menu component under the hood. We need to control closing
        // the menu so that escape press when the menu is open closes it without
        // bringing up the bottom tools drawer in chrome dev tools
        open={open()}
        onOpenChange={setOpen}
      >
        <ContextMenu.Trigger>
          <div
            ref={(elt) => {
              contextMenuTrigger = elt;
            }}
            class={styles.database}
            onClick={() => {
              setSelectedItem(local.dbIndex);
              if (hasStores()) {
                toggleExpandedDatabase(local.dbIndex);
              }
            }}
            onContextMenu={() => setOpen(true)}
          >
            <Show
              when={hasStores()}
              fallback={<div class={styles["no-object-stores"]} />}
            >
              <div class={styles.chevron}>
                <TriangleIcon
                  orientation={local.db.isExpanded ? "down" : "right"}
                />
              </div>
            </Show>
            <SingleLineText
              text={`${local.db.name}${hasStores() ? "" : " (empty)"}`}
            />
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <MenuContent closeMenu={() => setOpen(false)}>
            <ModalTriggerMenuItem
              modalId="delete-database-modal"
              disabled={deleteDBMutation.isLoading}
              onSelect={() => {
                setDBToDelete(local.dbIndex);
              }}
            >
              Delete
            </ModalTriggerMenuItem>
          </MenuContent>
        </ContextMenu.Portal>
      </ContextMenu>
      <Show when={hasStores()}>
        <ul role="group">
          <For each={local.db.objectStores}>
            {(objStore, objStoreIndex) => (
              <ObjectStoreItem
                ref={(elt) => {
                  storeRefs[objStoreIndex()] = elt;
                }}
                dbName={local.db.name}
                dbIndex={local.dbIndex}
                objectStore={objStore}
                objectStoreIndex={objStoreIndex()}
              />
            )}
          </For>
        </ul>
      </Show>
    </li>
  );
}

interface DatabaseItemProps extends Omit<
  JSX.HTMLAttributes<HTMLLIElement>,
  "children"
> {
  db: Database;
  dbIndex: number;
}
