import { ContextMenu } from "@kobalte/core/context-menu";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";

import MenuContent from "@/devtools/components/context-menu/MenuContent";
import ModalTriggerMenuItem from "@/devtools/components/context-menu/ModalTriggerMenuItem";
import {
  SidebarDatabase,
  useDatabaseTreeContext,
} from "@/devtools/components/sidebar/database-tree/database-tree-context";
import { useDeleteDatabaseContext } from "@/devtools/components/sidebar/database-tree/delete-database-context";
import ObjectStoreItem from "@/devtools/components/sidebar/database-tree/ObjectStoreItem";
import SingleLineText from "@/devtools/components/SingleLineText";
import TriangleIcon from "@/devtools/components/svg-icons/TriangleIcon";

import styles from "./DatabaseItem.module.css";

export default function DatabaseItem(props: DatabaseItemProps) {
  const { tree, setSelectedItem, toggleExpandedDatabase, focusItem, setRef } =
    useDatabaseTreeContext();
  const tabindex = createMemo(() => {
    const [dbPos, storePos] = tree.focusableItem;
    return dbPos === props.dbPos && storePos === undefined ? 0 : -1;
  });
  const isSelected = createMemo(() => {
    return (
      !!tree.selectedItem &&
      tree.selectedItem[0] === props.dbPos &&
      tree.selectedItem[1] === undefined
    );
  });
  const hasStores = () => props.db.objectStores.length > 0;

  let dbRef: HTMLLIElement;
  onMount(() => setRef(dbRef, props.dbPos));

  const { deleteDBMutation, setDBToDelete } = useDeleteDatabaseContext();
  const [open, setOpen] = createSignal(false);
  let contextMenuTrigger: HTMLDivElement;

  return (
    <li
      ref={(elt) => (dbRef = elt)}
      class={styles["database-item"]}
      aria-selected={isSelected()}
      aria-expanded={hasStores() ? props.db.isExpanded : undefined}
      tabindex={tabindex()}
      role="treeitem"
      onKeyDown={(event) => {
        if (hasStores()) {
          if (event.key === "ArrowRight") {
            if (props.db.isExpanded) {
              focusItem(props.dbPos, 0);
            } else {
              toggleExpandedDatabase(props.dbPos);
            }
          } else if (event.key === "ArrowLeft" && props.db.isExpanded) {
            toggleExpandedDatabase(props.dbPos);
          } else if (event.key === "Enter") {
            setSelectedItem(props.dbPos);
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
              setSelectedItem(props.dbPos);
              if (hasStores()) {
                toggleExpandedDatabase(props.dbPos);
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
                  orientation={props.db.isExpanded ? "down" : "right"}
                />
              </div>
            </Show>
            <SingleLineText
              text={`${props.db.name}${hasStores() ? "" : " (empty)"}`}
            />
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <MenuContent closeMenu={() => setOpen(false)}>
            <ModalTriggerMenuItem
              modalId="delete-database-modal"
              disabled={deleteDBMutation.isLoading}
              onSelect={() => {
                setDBToDelete(props.dbPos);
              }}
            >
              Delete
            </ModalTriggerMenuItem>
          </MenuContent>
        </ContextMenu.Portal>
      </ContextMenu>
      <Show when={hasStores()}>
        <ul role="group">
          <For each={props.db.objectStores}>
            {(objStore, objStoreIndex) => (
              <ObjectStoreItem
                dbName={props.db.name}
                dbPos={props.dbPos}
                objectStore={objStore}
                objectStorePos={objStoreIndex()}
              />
            )}
          </For>
        </ul>
      </Show>
    </li>
  );
}

interface DatabaseItemProps {
  db: SidebarDatabase;
  dbPos: number;
}
