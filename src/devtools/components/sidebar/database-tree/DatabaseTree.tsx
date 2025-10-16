import { batch, For } from "solid-js";
import { createStore } from "solid-js/store";

import {
  Database,
  DatabaseTreeContext,
  DatabaseTreeStore,
  TreeItem,
} from "@/devtools/components/sidebar/database-tree/database-tree-context";
import DatabaseItem from "@/devtools/components/sidebar/database-tree/DatabaseItem";
import styles from "@/devtools/components/sidebar/database-tree/DatabaseTree.module.css";
import { IndexedDB } from "@/devtools/utils/dummy-data";

/**
 * Sidebar Navigation
 * Accessibility work is based on https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 */
export default function DatabaseTree(props: DatabaseTreeProps) {
  const [tree, setTree] = createStore(getInitialTreeData(props.initialData));

  const setSelectedItem = (dbIndex: number, storeIndex?: number) => {
    // According to https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
    // only a single tree item (either a db or a store) can be selected at
    // any time
    batch(() => {
      setTree("selectedItem", [dbIndex, storeIndex]);
      setTree("focusableItem", [dbIndex, storeIndex]);
      _focusItem(dbIndex, storeIndex);
    });
  };
  const toggleExpandedDatabase = (dbIndex: number) => {
    setTree("databases", dbIndex, "isExpanded", (prev) => !prev);
  };
  const setRefs = (
    dbIndex: number,
    dbRef: HTMLLIElement,
    storeRefs: HTMLLIElement[],
  ) => {
    batch(() => {
      setTree("databases", dbIndex, "ref", dbRef);
      for (let i = 0; i < tree.databases[dbIndex].objectStores.length; i++) {
        setTree("databases", dbIndex, "objectStores", i, "ref", storeRefs[i]);
      }
    });
  };

  const _focusItem = (dbIndex: number, storeIndex?: number) => {
    setTree("focusedItem", [dbIndex, storeIndex]);
    if (storeIndex === undefined) {
      tree.databases[dbIndex].ref?.focus();
    } else {
      tree.databases[dbIndex].objectStores[storeIndex].ref?.focus();
    }
  };
  const focusItem = (dbIndex: number, storeIndex?: number) => {
    batch(() => {
      setTree("focusableItem", [dbIndex, storeIndex]);
      _focusItem(dbIndex, storeIndex);
    });
  };
  const _focusNextItem = () => {
    const [dbIndex, storeIndex] = tree.focusedItem!;
    const flatItems = _getFlatItems(tree.databases);
    const currentPos = flatItems.findIndex(
      ([i, j]) => i === dbIndex && j === storeIndex,
    );
    if (currentPos >= 0 && currentPos + 1 < flatItems.length) {
      const [nextDBIndex, nextStoreIndex] = flatItems[currentPos + 1];
      focusItem(nextDBIndex, nextStoreIndex);
    }
  };
  const _focusPreviousItem = () => {
    const [dbIndex, storeIndex] = tree.focusedItem!;
    const flatItems = _getFlatItems(tree.databases);
    const currentPos = flatItems.findIndex(
      ([i, j]) => i === dbIndex && j === storeIndex,
    );
    if (currentPos - 1 >= 0) {
      const [prevDBIndex, prevStoreIndex] = flatItems[currentPos - 1];
      focusItem(prevDBIndex, prevStoreIndex);
    }
  };
  const _focusLastItem = () => {
    const flatItems = _getFlatItems(tree.databases);
    const [dbIndex, storeIndex] = flatItems[flatItems.length - 1];
    focusItem(dbIndex, storeIndex);
  };

  return (
    <DatabaseTreeContext.Provider
      value={{
        tree,
        setSelectedItem,
        toggleExpandedDatabase,
        setRefs,
        focusItem,
      }}
    >
      <ul
        class={styles["database-tree"]}
        role="tree"
        aria-label="List of IndexedDBs"
        onFocusIn={() => {
          setTree("focusedItem", tree.focusableItem);
        }}
        onFocusOut={() => {
          setTree("focusedItem", null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            _focusNextItem();
          } else if (event.key === "ArrowUp") {
            _focusPreviousItem();
          } else if (event.key === "Home") {
            focusItem(0, undefined);
          } else if (event.key === "End") {
            _focusLastItem();
          }
        }}
      >
        <For each={tree.databases}>
          {(db, index) => <DatabaseItem db={db} dbIndex={index()} />}
        </For>
      </ul>
    </DatabaseTreeContext.Provider>
  );
}

function getInitialTreeData(databases: IndexedDB[]): DatabaseTreeStore {
  // todo restore last selected DB per origin to restore it when user comes back
  const initialData: Database[] = databases.map((db) => ({
    ref: null,
    name: db.name,
    version: db.version,
    isExpanded: false,
    objectStores: db.objectStores.map((name) => ({
      ref: null,
      name,
    })),
  }));
  if (initialData[0].objectStores.length) {
    initialData[0].isExpanded = true;
  }
  return {
    databases: initialData,
    selectedItem: null,
    focusedItem: null,
    focusableItem: [0, undefined],
  };
}

function _getFlatItems(databases: Database[]) {
  const flatItems: TreeItem[] = [];
  for (let i = 0; i < databases.length; i++) {
    flatItems.push([i, undefined]);
    const db = databases[i];
    if (db.isExpanded) {
      const items: TreeItem[] = db.objectStores.map((_, j) => [i, j]);
      flatItems.push(...items);
    }
  }

  return flatItems;
}

interface DatabaseTreeProps {
  initialData: IndexedDB[];
}
