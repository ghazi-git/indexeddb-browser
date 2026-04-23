import { ContextMenu } from "@kobalte/core/context-menu";
import { createMemo, createSignal, For, onMount } from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import MenuContent from "@/devtools/components/context-menu/MenuContent";
import ModalTriggerMenuItem from "@/devtools/components/context-menu/ModalTriggerMenuItem";
import { useClearStoreContext } from "@/devtools/components/sidebar/database-tree/clear-store-context";
import {
  SidebarStore,
  useDatabaseTreeContext,
} from "@/devtools/components/sidebar/database-tree/database-tree-context";
import IndexItem from "@/devtools/components/sidebar/database-tree/IndexItem";
import SingleLineText from "@/devtools/components/SingleLineText";
import StoreIcon from "@/devtools/components/svg-icons/StoreIcon";

import styles from "./ObjectStoreItem.module.css";

export default function ObjectStoreItem(props: ObjectStoreItemProps) {
  const { activeObjectStore } = useActiveObjectStoreContext();
  const isActiveStore = () => {
    const activeStore = activeObjectStore();
    return (
      activeStore?.dbName === props.dbName &&
      activeStore?.storeName === props.objectStore.name &&
      activeStore?.indexName === null
    );
  };
  const { tree, setSelectedItem, focusItem, setRef } = useDatabaseTreeContext();
  const tabindex = createMemo(() => {
    const [dbPos, storePos, indexPos] = tree.focusableItem;
    return dbPos === props.dbPos &&
      storePos === props.objectStorePos &&
      indexPos === undefined
      ? 0
      : -1;
  });
  const isSelected = createMemo(() => {
    return (
      !!tree.selectedItem &&
      tree.selectedItem[0] === props.dbPos &&
      tree.selectedItem[1] === props.objectStorePos &&
      tree.selectedItem[2] === undefined
    );
  });
  const { setStoreToBeCleared, clearStoreMutation } = useClearStoreContext();
  const [open, setOpen] = createSignal(false);
  let storeRef: HTMLLIElement;
  onMount(() => setRef(storeRef, props.dbPos, props.objectStorePos));

  return (
    <>
      {/* @ts-expect-error open is not part of ContextMenu props, but it is possible to pass it since ContextMenu and DropdownMenu use the same underlying Menu component under the hood */}
      <ContextMenu open={open()} onOpenChange={setOpen}>
        <ContextMenu.Trigger>
          <li
            ref={(elt) => (storeRef = elt)}
            class={styles["object-store"]}
            data-active-store={isActiveStore()}
            aria-selected={isSelected()}
            onClick={() => {
              setSelectedItem(props.dbPos, props.objectStorePos);
            }}
            role="treeitem"
            tabindex={tabindex()}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.stopPropagation();
                focusItem(props.dbPos);
              } else if (event.key === "ArrowRight") {
                // don't let the event bubble up to DatabaseItem to avoid triggering
                // its event listener
                event.stopPropagation();
              } else if (event.key === "Enter") {
                event.stopPropagation();
                setSelectedItem(props.dbPos, props.objectStorePos);
              }
            }}
            onContextMenu={() => setOpen(true)}
          >
            <div class={styles["object-store-icon"]}>
              <StoreIcon />
            </div>
            <SingleLineText text={props.objectStore.name} />
          </li>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <MenuContent closeMenu={() => setOpen(false)}>
            <ModalTriggerMenuItem
              modalId="clear-store-sidebar-modal"
              disabled={clearStoreMutation.isLoading}
              onSelect={() => {
                setStoreToBeCleared(props.dbPos, props.objectStorePos);
              }}
            >
              Clear
            </ModalTriggerMenuItem>
          </MenuContent>
        </ContextMenu.Portal>
      </ContextMenu>
      <For each={props.objectStore.indexes}>
        {(index, idx) => (
          <IndexItem
            dbName={props.dbName}
            dbPos={props.dbPos}
            storeName={props.objectStore.name}
            storePos={props.objectStorePos}
            indexName={index.name}
            indexPos={idx()}
          />
        )}
      </For>
    </>
  );
}

interface ObjectStoreItemProps {
  dbName: string;
  dbPos: number;
  objectStore: SidebarStore;
  objectStorePos: number;
}
