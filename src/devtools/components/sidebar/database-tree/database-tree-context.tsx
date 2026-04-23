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
  setSelectedItem: (
    dbPos: number,
    storePos?: number,
    indexPos?: number,
  ) => void;
  setRef: (
    ref: HTMLLIElement,
    dbPos: number,
    storePos?: number,
    indexPos?: number,
  ) => void;
  toggleExpandedDatabase: (dbPos: number) => void;
  focusItem: (dbPos: number, storePos?: number, indexPos?: number) => void;
}

export type TreeItem = [
  dbPos: number,
  storePos: number | undefined,
  indexPos: number | undefined,
];

export interface DatabaseTreeStore {
  databases: SidebarDatabase[];
  // for accessibility
  selectedItem: TreeItem | null; // aria-selected=true
  focusedItem: TreeItem | null;
  focusableItem: TreeItem; // tabindex=0
}

export interface SidebarDatabase {
  ref: HTMLLIElement | null;
  name: string;
  isExpanded: boolean;
  objectStores: SidebarStore[];
}

export interface SidebarStore {
  ref: HTMLLIElement | null;
  name: string;
  indexes: SidebarIndex[];
}

interface SidebarIndex {
  ref: HTMLLIElement | null;
  name: string;
}
