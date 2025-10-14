import { batch, createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const SidebarContext = createContext<SidebarContextType>();

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext: no provide found for SidebarContext");
  }

  return context;
}

export function SidebarContextProvider(props: FlowProps) {
  const state = getSidebarState();
  const [store, setStore] = createStore({
    isOpen: state.isOpen,
    databases: state.databases,
    get selectedDatabase() {
      return this.databases.find((db) => db.isSelected);
    },
  });
  const openSidebar = () => {
    setStore("isOpen", true);
    storeSidebarState(store);
  };
  const closeSidebar = () => {
    setStore("isOpen", false);
    storeSidebarState(store);
  };

  const setSelectedItem = (dbName: string, storeName?: string) => {
    // According to https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
    // only a single tree item can be selected at any time
    batch(() => {
      for (let i = 0; i < store.databases.length; i++) {
        const db = store.databases[i];
        const isSelected = storeName ? false : db.name === dbName;
        setStore("databases", i, "isSelected", isSelected);

        for (let j = 0; j < db.objectStores.length; j++) {
          const isSelected =
            db.name === dbName && db.objectStores[j].name === storeName;
          setStore("databases", i, "objectStores", j, "isSelected", isSelected);
        }
      }
    });
    storeSidebarState(store);
  };
  const toggleExpandedDatabase = (dbName: string) => {
    const index = store.databases.findIndex((db) => db.name === dbName);
    if (index >= 0) {
      setStore("databases", index, "isExpanded", (prev) => !prev);
    }
    storeSidebarState(store);
  };

  return (
    <SidebarContext.Provider
      value={{
        sidebar: store,
        openSidebar,
        closeSidebar,
        setSelectedItem,
        toggleExpandedDatabase,
      }}
    >
      {props.children}
    </SidebarContext.Provider>
  );
}

function storeSidebarState(state: SidebarStore) {
  const toStore = { isOpen: state.isOpen, databases: state.databases };
  localStorage.setItem("sidebar-state", JSON.stringify(toStore));
}

function getSidebarState(): SidebarState {
  const defaultState = { isOpen: true, databases: [] as Database[] };
  const state = localStorage.getItem("sidebar-state");
  if (!state) return defaultState;

  try {
    const sidebarState = JSON.parse(state);
    return { ...defaultState, ...sidebarState };
  } catch (e) {
    console.error(
      "sidebar-state-retrieval: failure to get sidebar state from local storage",
      e,
    );
    return defaultState;
  }
}

interface SidebarContextType {
  sidebar: SidebarStore;
  openSidebar: () => void;
  closeSidebar: () => void;
  setSelectedItem: (dbName: string, storeName?: string) => void;
  toggleExpandedDatabase: (dbName: string) => void;
}

interface SidebarState {
  isOpen: boolean;
  databases: Database[];
}

interface SidebarStore extends SidebarState {
  readonly selectedDatabase: Database | undefined;
}

interface Database {
  name: string;
  version: number;
  isSelected: boolean;
  isExpanded: boolean;
  objectStores: ObjectStore[];
}

interface ObjectStore {
  name: string;
  isSelected: boolean;
}
