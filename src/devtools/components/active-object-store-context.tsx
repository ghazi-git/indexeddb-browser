import {
  Accessor,
  createContext,
  createEffect,
  createResource,
  createSignal,
  FlowProps,
  Resource,
  Setter,
  Signal,
  untrack,
  useContext,
} from "solid-js";

import { useIndexedDBContext } from "@/devtools/components/indexeddb-context";
import { useOriginContext } from "@/devtools/components/origin-context";
import { getStoreData } from "@/devtools/utils/dummy-data";

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

  const [objectStore, { refetch }] = createObjStoreResource(activeObjectStore);
  const refetchObjectStoreData = () => {
    refetch();
  };

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
        objectStore,
        refetchObjectStoreData,
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

function createObjStoreResource(
  activeObjStore: Accessor<ActiveObjectStore | null>,
) {
  return createResource(
    activeObjStore,
    ({ dbName, storeName }: ActiveObjectStore) => {
      return getStoreData(dbName, storeName) as Promise<ObjectStoreData>;
    },
  );
}

interface ActiveObjectStoreContextType {
  activeObjectStore: Accessor<ActiveObjectStore | null>;
  setActiveObjectStore: Setter<ActiveObjectStore | null>;
  objectStore: Resource<ObjectStoreData>;
  refetchObjectStoreData: () => void;
}

export type ActiveObjectStore = { dbName: string; storeName: string };

// only stores with a keyPath are displayed since the values stored are js
// objects in this case. If no keyPath, the values can be anything, so
// recommend using the native indexedDB viewer
// todo handle store not found (maybe deleted) or maybe handle together
//  with error in general
type ObjectStoreData =
  | {
      canDisplay: true;
      keypath: string | string[];
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      data: Record<string, any>[];
    }
  | {
      canDisplay: false;
      keypath: null;
      data: null;
    };
