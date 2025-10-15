import { createMemo, JSX, splitProps } from "solid-js";

import {
  ObjectStore,
  useDatabaseTreeContext,
} from "@/devtools/components/sidebar/database-tree/database-tree-context";
import SingleLineText from "@/devtools/components/SingleLineText";
import StoreIcon from "@/devtools/components/svg-icons/StoreIcon";

import styles from "./ObjectStoreItem.module.css";

export default function ObjectStoreItem(props: ObjectStoreItemProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "dbIndex",
    "objectStore",
    "objectStoreIndex",
  ]);
  const { tree, setSelectedItem, focusItem } = useDatabaseTreeContext();
  const tabindex = createMemo(() => {
    const [focusableDBIndex, focusableStoreIndex] = tree.focusableItem;
    return focusableDBIndex === local.dbIndex &&
      focusableStoreIndex === local.objectStoreIndex
      ? 0
      : -1;
  });
  const isSelected = createMemo(() => {
    return (
      !!tree.selectedItem &&
      tree.selectedItem[0] === local.dbIndex &&
      tree.selectedItem[1] === local.objectStoreIndex
    );
  });

  return (
    <li
      class={`${styles["object-store"]} ${local.class ?? ""}`}
      aria-selected={isSelected()}
      onClick={() => {
        setSelectedItem(local.dbIndex, local.objectStoreIndex);
      }}
      role="treeitem"
      tabindex={tabindex()}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.stopPropagation();
          focusItem(local.dbIndex);
        } else if (event.key === "Enter") {
          event.stopPropagation();
          setSelectedItem(local.dbIndex, local.objectStoreIndex);
        }
      }}
      {...rest}
    >
      <div class={styles["object-store-icon"]}>
        <StoreIcon />
      </div>
      <SingleLineText text={local.objectStore.name} />
    </li>
  );
}

interface ObjectStoreItemProps
  extends Omit<JSX.LiHTMLAttributes<HTMLLIElement>, "children"> {
  dbIndex: number;
  objectStore: ObjectStore;
  objectStoreIndex: number;
}
