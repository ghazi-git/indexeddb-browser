import { JSX, splitProps } from "solid-js";

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
  const { setSelectedItem } = useDatabaseTreeContext();

  return (
    <li
      class={`${styles["object-store"]} ${local.class ?? ""}`}
      aria-selected={local.objectStore.isSelected}
      onClick={() => {
        setSelectedItem(local.dbIndex, local.objectStoreIndex);
      }}
      role="treeitem"
      tabindex={local.objectStore.tabindex}
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
