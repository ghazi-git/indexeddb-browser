import { For, Show } from "solid-js";

import { useSidebarContext } from "@/devtools/components/sidebar/sidebar-context";
import SingleLineText from "@/devtools/components/SingleLineText";
import StoreIcon from "@/devtools/components/svg-icons/StoreIcon";
import TriangleIcon from "@/devtools/components/svg-icons/TriangleIcon";

import styles from "./DatabaseTree.module.css";

export default function DatabaseTree() {
  const { sidebar, setSelectedItem, toggleExpandedDatabase } =
    useSidebarContext();
  return (
    <ul
      class={styles["database-tree"]}
      role="tree"
      aria-label="List of IndexedDBs"
    >
      <For each={sidebar.databases}>
        {(db) => (
          <li
            class={styles["database-item"]}
            aria-selected={db.isSelected}
            aria-expanded={db.objectStores.length ? db.isExpanded : undefined}
            role="treeitem"
          >
            <div
              class={styles.database}
              onClick={() => {
                setSelectedItem(db.name);
                toggleExpandedDatabase(db.name);
              }}
            >
              <Show
                when={db.objectStores.length}
                fallback={<div class={styles["no-object-stores"]} />}
              >
                <div class={styles.chevron}>
                  <TriangleIcon
                    orientation={db.isExpanded ? "down" : "right"}
                  />
                </div>
              </Show>
              <SingleLineText text={db.name} />
            </div>
            <Show when={db.objectStores.length}>
              <ul role="group">
                <For each={db.objectStores}>
                  {(objStore) => (
                    <li
                      class={styles["object-store"]}
                      aria-selected={objStore.isSelected}
                      onClick={() => {
                        setSelectedItem(db.name, objStore.name);
                      }}
                      role="treeitem"
                    >
                      <div class={styles["object-store-icon"]}>
                        <StoreIcon />
                      </div>
                      <SingleLineText text={objStore.name} />
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </li>
        )}
      </For>
    </ul>
  );
}
