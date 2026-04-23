import { batch, createEffect, For, untrack } from "solid-js";
import { createStore } from "solid-js/store";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { ClearStoreContextProvider } from "@/devtools/components/sidebar/database-tree/clear-store-context";
import {
  DatabaseTreeContext,
  DatabaseTreeStore,
  SidebarDatabase,
  TreeItem,
} from "@/devtools/components/sidebar/database-tree/database-tree-context";
import DatabaseItem from "@/devtools/components/sidebar/database-tree/DatabaseItem";
import styles from "@/devtools/components/sidebar/database-tree/DatabaseTree.module.css";
import { DeleteDatabaseContextProvider } from "@/devtools/components/sidebar/database-tree/delete-database-context";
import { IndexedDB } from "@/devtools/utils/types";

/**
 * Sidebar Navigation
 * Accessibility work is based on https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 */
export default function DatabaseTree(props: DatabaseTreeProps) {
  const [tree, setTree] = createStore(getInitialTreeData(props.initialData));

  const setSelectedItem = (
    dbPos: number,
    storePos?: number,
    indexPos?: number,
  ) => {
    // According to https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
    // only a single tree item (either a db or a store) can be selected at
    // any time
    setTree((prev) => ({
      ...prev,
      selectedItem: [dbPos, storePos, indexPos],
      focusableItem: [dbPos, storePos, indexPos],
      focusedItem: [dbPos, storePos, indexPos],
    }));
    _focusItem(dbPos, storePos, indexPos);
  };
  const setRef = (
    ref: HTMLLIElement,
    dbPos: number,
    storePos?: number,
    indexPos?: number,
  ) => {
    if (storePos !== undefined && indexPos !== undefined) {
      // prettier-ignore
      setTree("databases", dbPos, "objectStores", storePos, "indexes", indexPos, "ref", ref);
    } else if (storePos !== undefined) {
      setTree("databases", dbPos, "objectStores", storePos, "ref", ref);
    } else {
      setTree("databases", dbPos, "ref", ref);
    }
  };
  const toggleExpandedDatabase = (dbPos: number) => {
    setTree("databases", dbPos, "isExpanded", (prev) => !prev);
  };
  const focusItem = (dbPos: number, storePos?: number, indexPos?: number) => {
    setTree((prev) => ({
      ...prev,
      focusableItem: [dbPos, storePos, indexPos],
      focusedItem: [dbPos, storePos, indexPos],
    }));
    _focusItem(dbPos, storePos, indexPos);
  };
  const _focusItem = (dbPos: number, storePos?: number, indexPos?: number) => {
    if (storePos !== undefined && indexPos !== undefined) {
      // prettier-ignore
      tree.databases[dbPos].objectStores[storePos].indexes[indexPos].ref?.focus();
    } else if (storePos !== undefined) {
      tree.databases[dbPos].objectStores[storePos].ref?.focus();
    } else {
      tree.databases[dbPos].ref?.focus();
    }
  };
  const _focusNextItem = () => {
    const focusedItem = tree.focusedItem;
    if (focusedItem) {
      const [dbPos, storePos, indexPos] = focusedItem;
      const flatItems = _getFlatItems(tree.databases);
      const currentPos = flatItems.findIndex(
        ([i, j, k]) => i === dbPos && j === storePos && k === indexPos,
      );
      if (currentPos >= 0 && currentPos < flatItems.length - 1) {
        const [nextDBPos, nextStorePos, nextIndexPos] =
          flatItems[currentPos + 1];
        focusItem(nextDBPos, nextStorePos, nextIndexPos);
      }
    }
  };
  const _focusPreviousItem = () => {
    const focusedItem = tree.focusedItem;
    if (focusedItem) {
      const [dbPos, storePos, indexPos] = focusedItem;
      const flatItems = _getFlatItems(tree.databases);
      const currentPos = flatItems.findIndex(
        ([i, j, k]) => i === dbPos && j === storePos && k === indexPos,
      );
      if (currentPos - 1 >= 0) {
        const [prevDBPos, prevStorePos, nextIndexPos] =
          flatItems[currentPos - 1];
        focusItem(prevDBPos, prevStorePos, nextIndexPos);
      }
    }
  };
  const _focusLastItem = () => {
    const flatItems = _getFlatItems(tree.databases);
    const [dbPos, storePos, indexPos] = flatItems[flatItems.length - 1];
    focusItem(dbPos, storePos, indexPos);
  };

  // set the active store on selected item change
  const { activeObjectStore, setActiveObjectStore } =
    useActiveObjectStoreContext();
  createEffect(() => {
    const item = tree.selectedItem;
    if (item) {
      const [dbPos, storePos, indexPos] = item;
      if (storePos !== undefined) {
        const dbName = tree.databases[dbPos].name;
        const storeName = tree.databases[dbPos].objectStores[storePos].name;
        const indexName =
          indexPos !== undefined
            ? tree.databases[dbPos].objectStores[storePos].indexes[indexPos]
                .name
            : null;
        setActiveObjectStore({ dbName, storeName, indexName });
      }
    }
  });
  // set the selected item on active store change
  createEffect(() => {
    const activeStore = activeObjectStore();
    if (activeStore) {
      const { dbName, storeName, indexName } = activeStore;
      const item = untrack((): TreeItem | null => {
        const dbPos = tree.databases.findIndex((db) => db.name === dbName);
        const storePos =
          tree.databases[dbPos]?.objectStores.findIndex(
            (st) => st.name === storeName,
          ) ?? -1;
        if (dbPos >= 0 && storePos >= 0) {
          if (indexName === null) return [dbPos, storePos, undefined];

          const indexPos = tree.databases[dbPos].objectStores[
            storePos
          ].indexes.findIndex((index) => index.name === indexName);
          if (indexPos >= 0) return [dbPos, storePos, indexPos];
        }
        return null;
      });
      if (item) {
        batch(() => {
          setTree("databases", item[0], "isExpanded", true);
          setTree("selectedItem", item);
          setTree("focusableItem", item);
        });
      }
    } else {
      setTree("databases", 0, "isExpanded", true);
    }
  });

  return (
    <DatabaseTreeContext.Provider
      value={{
        tree,
        setSelectedItem,
        setRef,
        toggleExpandedDatabase,
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
        <DeleteDatabaseContextProvider>
          <ClearStoreContextProvider>
            <For each={tree.databases}>
              {(db, index) => <DatabaseItem db={db} dbPos={index()} />}
            </For>
          </ClearStoreContextProvider>
        </DeleteDatabaseContextProvider>
      </ul>
    </DatabaseTreeContext.Provider>
  );
}

function getInitialTreeData(databases: IndexedDB[]): DatabaseTreeStore {
  const initialData: SidebarDatabase[] = databases.map((db) => ({
    ref: null,
    name: db.name,
    isExpanded: false,
    objectStores: db.objectStores.map((store) => ({
      ref: null,
      name: store.name,
      indexes: store.indexNames.map((name) => ({ ref: null, name })),
    })),
  }));
  return {
    databases: initialData,
    selectedItem: null,
    focusedItem: null,
    focusableItem: [0, undefined, undefined],
  };
}

function _getFlatItems(databases: SidebarDatabase[]) {
  const flatItems: TreeItem[] = [];
  databases.forEach((db, i) => {
    flatItems.push([i, undefined, undefined]);
    if (db.isExpanded) {
      db.objectStores.forEach((store, j) => {
        flatItems.push([i, j, undefined]);
        const items: TreeItem[] = store.indexes.map((_, k) => [i, j, k]);
        flatItems.push(...items);
      });
    }
  });

  return flatItems;
}

interface DatabaseTreeProps {
  initialData: IndexedDB[];
}
