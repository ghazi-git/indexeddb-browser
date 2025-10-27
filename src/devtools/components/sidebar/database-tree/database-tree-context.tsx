import { createContext, useContext } from "solid-js";

export const DatabaseTreeContext = createContext<DatabaseTreeContextType>();

export function useDatabaseTreeContext() {
  const context = useContext(DatabaseTreeContext);
  if (!context) {
    throw new Error("useDatabaseTreeContext: cannot find DatabaseTreeContext");
  }

  return context;
}

interface DatabaseTreeContextType {
  tree: DatabaseTreeStore;
  setSelectedItem: (dbIndex: number, storeIndex?: number) => void;
  toggleExpandedDatabase: (dbIndex: number) => void;
  setRefs: (
    dbIndex: number,
    dbRef: HTMLLIElement,
    storeRefs: HTMLLIElement[],
  ) => void;
  focusItem: (dbIndex: number, storeIndex?: number) => void;
}

export type TreeItem = [dbIndex: number, storeIndex: number | undefined];

export interface DatabaseTreeStore {
  databases: Database[];
  // for accessibility
  selectedItem: TreeItem | null; // aria-selected=true
  focusedItem: TreeItem | null;
  focusableItem: TreeItem; // tabindex=0
}

export interface Database {
  ref: HTMLLIElement | null;
  name: string;
  isExpanded: boolean;
  objectStores: ObjectStore[];
}

export interface ObjectStore {
  ref: HTMLLIElement | null;
  name: string;
}
