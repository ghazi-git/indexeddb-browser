import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  FlowProps,
  onCleanup,
  onMount,
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
  // track the list of object stores visited along with an index that *always*
  // indicates the currently active store (if the active store is set to null,
  // the history will reset)
  const [history, setHistory] = createSignal<ActiveStoreHistory>({
    index: null,
    stack: [],
  });

  const setActiveObjectStore = (activeStore: ActiveObjectStore) => {
    let prevEqualsNew = false;
    _setActiveStore((prev) => {
      prevEqualsNew =
        prev?.dbName === activeStore.dbName &&
        prev?.storeName === activeStore.storeName;
      return activeStore;
    });
    if (!prevEqualsNew) {
      setHistory((prev) => {
        if (prev.index === null) {
          return { index: 0, stack: [activeStore] };
        } else {
          return {
            index: prev.index + 1,
            stack: [...prev.stack.slice(0, prev.index + 1), activeStore],
          };
        }
      });
    }
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
          setHistory({ index: 0, stack: [lastViewedStore] });
        } else {
          _setActiveStore(null);
          setHistory({ index: null, stack: [] });
        }
      } else {
        _setActiveStore(null);
        setHistory({ index: null, stack: [] });
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
        setHistory({ index: null, stack: [] });
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
            setHistory({ index: 0, stack: [lastViewedStore] });
          }
        }
      }
    }
  });

  const goToPreviousStore = ({ index, stack }: ActiveStoreHistory) => {
    if (index) {
      _setActiveStore(stack[index - 1]);
      setHistory({ index: index - 1, stack });
    }
  };
  const goToNextStore = ({ index, stack }: ActiveStoreHistory) => {
    if (index !== null && index < stack.length - 1) {
      _setActiveStore(stack[index + 1]);
      setHistory({ index: index + 1, stack });
    }
  };
  const backForwardClickHandler = (event: PointerEvent) => {
    if (event.button === 3) {
      goToPreviousStore(history());
    } else if (event.button === 4) {
      goToNextStore(history());
    }
  };
  const backForwardShortcutsHandler = (event: KeyboardEvent) => {
    if (
      event.ctrlKey &&
      event.altKey &&
      event.key === "ArrowLeft" &&
      !event.shiftKey &&
      !event.metaKey
    ) {
      goToPreviousStore(history());
    } else if (
      event.ctrlKey &&
      event.altKey &&
      event.key === "ArrowRight" &&
      !event.shiftKey &&
      !event.metaKey
    ) {
      goToNextStore(history());
    }
  };
  onMount(() => {
    document.addEventListener("auxclick", backForwardClickHandler);
    document.addEventListener("keydown", backForwardShortcutsHandler);
  });
  onCleanup(() => {
    document.removeEventListener("auxclick", backForwardClickHandler);
    document.removeEventListener("keydown", backForwardShortcutsHandler);
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

type ActiveStoreHistory =
  | { index: null; stack: [] }
  | { index: number; stack: ActiveObjectStore[] };
