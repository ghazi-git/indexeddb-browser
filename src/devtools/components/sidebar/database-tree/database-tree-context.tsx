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
}

interface DatabaseTreeStore {
  databases: Database[];
}

export interface Database {
  ref: HTMLLIElement | null;
  name: string;
  version: number;
  isSelected: boolean;
  isExpanded: boolean;
  isFocused: boolean;
  objectStores: ObjectStore[];
}

export interface ObjectStore {
  ref: HTMLLIElement | null;
  name: string;
  isSelected: boolean;
}
