import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  FlowProps,
  Setter,
  Signal,
  untrack,
  useContext,
} from "solid-js";

import { useIndexedDBContext } from "@/devtools/components/indexeddb-context";
import { useOriginContext } from "@/devtools/components/origin-context";

const ActiveObjectStoreContext = createContext<ActiveObjectStoreContextType>();

export function useActiveObjectStoreContext() {
  const context = useContext(ActiveObjectStoreContext);
  if (!context) {
    throw new Error(
      "useActiveObjectStoreContext: cannot find ActiveObjectStoreContext",
    );
  }

  return context;
}

export function ActiveObjectStoreContextProvider(props: FlowProps) {
  const [activeObjectStore, setActiveObjectStore] = createActiveObjectStore();

  // if the user navigates away from the current origin, unset the active store
  const { origin } = useOriginContext();
  createEffect(() => {
    const activeStore = untrack(() => activeObjectStore());
    if (activeStore && origin()) {
      setActiveObjectStore(null);
    }
  });

  // if the active store is no longer in the indexedDB (e.g. deleted), unset it
  const { databases } = useIndexedDBContext();
  createEffect(() => {
    const dbs = databases();
    const activeStore = untrack(() => activeObjectStore());
    if (dbs && activeStore) {
      const { dbName, storeName } = activeStore;
      const db = dbs.find((db) => db.name === dbName);
      const objStore = db?.objectStores.find((st) => st === storeName);
      if (!objStore) {
        setActiveObjectStore(null);
      }
    }
  });

  return (
    <ActiveObjectStoreContext.Provider
      value={{
        activeObjectStore,
        setActiveObjectStore,
      }}
    >
      {props.children}
    </ActiveObjectStoreContext.Provider>
  );
}

function createActiveObjectStore(): Signal<ActiveObjectStore | null> {
  const [accessor, setter] = createSignal<ActiveObjectStore | null>(null, {
    equals: (prev, next) => {
      return (
        prev?.dbName === next?.dbName && prev?.storeName === next?.storeName
      );
    },
  });
  return [accessor, setter];
}

interface ActiveObjectStoreContextType {
  activeObjectStore: Accessor<ActiveObjectStore | null>;
  setActiveObjectStore: Setter<ActiveObjectStore | null>;
}

export type ActiveObjectStore = {
  dbName: string;
  dbVersion: number;
  storeName: string;
};
