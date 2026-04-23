import { createMemo, onMount } from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useDatabaseTreeContext } from "@/devtools/components/sidebar/database-tree/database-tree-context";
import SingleLineText from "@/devtools/components/SingleLineText";

import styles from "./IndexItem.module.css";

export default function IndexItem(props: IndexItemProps) {
  const { activeObjectStore } = useActiveObjectStoreContext();
  const isActiveIndex = () => {
    const activeStore = activeObjectStore();
    return (
      activeStore?.dbName === props.dbName &&
      activeStore?.storeName === props.storeName &&
      activeStore?.indexName === props.indexName
    );
  };
  const { tree, setSelectedItem, focusItem, setRef } = useDatabaseTreeContext();
  const tabindex = createMemo(() => {
    const [dbPos, storePos, indexPos] = tree.focusableItem;
    return dbPos === props.dbPos &&
      storePos === props.storePos &&
      indexPos === props.indexPos
      ? 0
      : -1;
  });
  const isSelected = createMemo(() => {
    return (
      !!tree.selectedItem &&
      tree.selectedItem[0] === props.dbPos &&
      tree.selectedItem[1] === props.storePos &&
      tree.selectedItem[2] === props.indexPos
    );
  });

  let indexRef: HTMLLIElement;
  onMount(() => setRef(indexRef, props.dbPos, props.storePos, props.indexPos));

  return (
    <li
      ref={(elt) => (indexRef = elt)}
      class={styles.index}
      data-active-index={isActiveIndex()}
      aria-selected={isSelected()}
      onClick={() => {
        setSelectedItem(props.dbPos, props.storePos, props.indexPos);
      }}
      role="treeitem"
      tabindex={tabindex()}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.stopPropagation();
          focusItem(props.dbPos);
        } else if (event.key === "ArrowRight") {
          event.stopPropagation();
        } else if (event.key === "Enter") {
          event.stopPropagation();
          setSelectedItem(props.dbPos, props.storePos, props.indexPos);
        }
      }}
      onContextMenu={(event) => event.stopPropagation()}
    >
      <SingleLineText text={props.indexName} />
    </li>
  );
}

interface IndexItemProps {
  dbName: string;
  dbPos: number;
  storeName: string;
  storePos: number;
  indexName: string;
  indexPos: number;
}
