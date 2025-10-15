import { batch, For } from "solid-js";
import { createStore } from "solid-js/store";

import {
  Database,
  DatabaseTreeContext,
} from "@/devtools/components/sidebar/database-tree/database-tree-context";
import DatabaseItem from "@/devtools/components/sidebar/database-tree/DatabaseItem";
import styles from "@/devtools/components/sidebar/database-tree/DatabaseTree.module.css";
import { IndexedDB } from "@/devtools/utils/dummy-data";

export default function DatabaseTree(props: DatabaseTreeProps) {
  const [tree, setTree] = createStore(getInitialTreeData(props.initialData));

  const setSelectedItem = (dbIndex: number, storeIndex?: number) => {
    // According to https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
    // only a single tree item (either a db or a store) can be selected at
    // any time
    batch(() => {
      for (let i = 0; i < tree.databases.length; i++) {
        const db = tree.databases[i];
        const isSelected = i === dbIndex && storeIndex === undefined;
        setTree("databases", i, "isSelected", isSelected);

        for (let j = 0; j < db.objectStores.length; j++) {
          const isSelected = i === dbIndex && j === storeIndex;
          setTree("databases", i, "objectStores", j, "isSelected", isSelected);
        }
      }
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

  return (
    <DatabaseTreeContext.Provider
      value={{ tree, setSelectedItem, toggleExpandedDatabase, setRefs }}
    >
      <ul
        class={styles["database-tree"]}
        role="tree"
        aria-label="List of IndexedDBs"
      >
        <For each={tree.databases}>
          {(db, index) => <DatabaseItem db={db} dbIndex={index()} />}
        </For>
      </ul>
    </DatabaseTreeContext.Provider>
  );
}

function getInitialTreeData(databases: IndexedDB[]) {
  // todo restore last selected DB per origin to restore it when user comes back
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  const initialData: Database[] = databases
    .map((db) => ({
      ref: null,
      name: db.name,
      version: db.version,
      isSelected: false,
      isExpanded: false,
      isFocused: false,
      objectStores: db.objectStores
        .map((name) => ({
          ref: null,
          name,
          isSelected: false,
        }))
        .toSorted((obj1, obj2) => collator.compare(obj1.name, obj2.name)),
    }))
    .toSorted((db1, db2) => collator.compare(db1.name, db2.name));
  if (initialData[0].objectStores.length) {
    initialData[0].isExpanded = true;
  }
  return { databases: initialData };
}

interface DatabaseTreeProps {
  initialData: IndexedDB[];
}
