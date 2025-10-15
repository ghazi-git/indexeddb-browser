import { For, JSX, onMount, Show, splitProps } from "solid-js";

import {
  Database,
  useDatabaseTreeContext,
} from "@/devtools/components/sidebar/database-tree/database-tree-context";
import ObjectStoreItem from "@/devtools/components/sidebar/database-tree/ObjectStoreItem";
import SingleLineText from "@/devtools/components/SingleLineText";
import TriangleIcon from "@/devtools/components/svg-icons/TriangleIcon";

import styles from "./DatabaseItem.module.css";

export default function DatabaseItem(props: DatabaseItemProps) {
  const [local, rest] = splitProps(props, ["class", "db", "dbIndex"]);
  const { setSelectedItem, toggleExpandedDatabase, setRefs } =
    useDatabaseTreeContext();
  let dbRef!: HTMLLIElement;
  const storeRefs: HTMLLIElement[] = [];
  onMount(() => {
    setRefs(local.dbIndex, dbRef, storeRefs);
  });

  return (
    <li
      ref={dbRef}
      class={`${styles["database-item"]} ${local.class ?? ""}`}
      aria-selected={local.db.isSelected}
      aria-expanded={
        local.db.objectStores.length ? local.db.isExpanded : undefined
      }
      tabindex={local.db.tabindex}
      role="treeitem"
      {...rest}
    >
      <div
        class={styles.database}
        onClick={() => {
          setSelectedItem(local.dbIndex);
          if (local.db.objectStores.length) {
            toggleExpandedDatabase(local.dbIndex);
          }
        }}
      >
        <Show
          when={local.db.objectStores.length}
          fallback={<div class={styles["no-object-stores"]} />}
        >
          <div class={styles.chevron}>
            <TriangleIcon
              orientation={local.db.isExpanded ? "down" : "right"}
            />
          </div>
        </Show>
        <SingleLineText text={local.db.name} />
      </div>
      <Show when={local.db.objectStores.length}>
        <ul role="group">
          <For each={local.db.objectStores}>
            {(objStore, objStoreIndex) => (
              <ObjectStoreItem
                ref={(elt) => {
                  storeRefs[objStoreIndex()] = elt;
                }}
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

interface DatabaseItemProps
  extends Omit<JSX.HTMLAttributes<HTMLLIElement>, "children"> {
  db: Database;
  dbIndex: number;
}
