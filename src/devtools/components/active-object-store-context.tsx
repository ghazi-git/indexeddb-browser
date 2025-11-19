import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  FlowProps,
  Signal,
  untrack,
  useContext,
} from "solid-js";

import { useIndexedDBContext } from "@/devtools/components/indexeddb-context";
import { useOriginContext } from "@/devtools/components/origin-context";
import {
  getLastViewedStore,
  saveLastViewedStore,
} from "@/devtools/utils/saved-settings";
import { ActiveObjectStore } from "@/devtools/utils/types";

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
  const [activeObjectStore, _setActiveStore] = createActiveObjectStore();

  const setActiveObjectStore = (activeStore: ActiveObjectStore) => {
    _setActiveStore(activeStore);
    const currentOrigin = untrack(() => origin());
    if (currentOrigin) {
      saveLastViewedStore(
        currentOrigin,
        activeStore.dbName,
        activeStore.storeName,
      );
    }
  };

  // if the user navigates away from the current origin, unset the active store
  const { origin } = useOriginContext();
  createEffect(() => {
    const currentOrigin = origin();
    const activeStore = untrack(() => activeObjectStore());
    if (currentOrigin && activeStore) {
      // load the last viewed store, if any, and it still exists
      const lastViewedStore = getLastViewedStore(currentOrigin);
      if (lastViewedStore) {
        const { dbName, storeName } = lastViewedStore;
        const dbs = untrack(() => databases());
        const indexeddb = dbs?.find((db) => db.name === dbName);
        if (indexeddb && indexeddb.objectStores.includes(storeName)) {
          _setActiveStore(lastViewedStore);
        } else {
          _setActiveStore(null);
        }
      } else {
        _setActiveStore(null);
      }
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
        _setActiveStore(null);
      }
    } else if (dbs) {
      const currentOrigin = untrack(() => origin());
      if (currentOrigin) {
        const lastViewedStore = getLastViewedStore(currentOrigin);
        // check the last viewed db still exists in the databases list
        if (lastViewedStore) {
          const { dbName, storeName } = lastViewedStore;
          const indexeddb = dbs.find((db) => db.name === dbName);
          if (indexeddb && indexeddb.objectStores.includes(storeName)) {
            _setActiveStore(lastViewedStore);
          }
        }
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
  setActiveObjectStore: (activeStore: ActiveObjectStore) => void;
}
