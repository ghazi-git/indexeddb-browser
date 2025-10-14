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

  const toggleSelectedDatabase = (dbName: string) => {
    if (store.selectedDatabase?.name === dbName) {
      store.selectedDatabase.isSelected = false;
      return;
    }

    batch(() => {
      for (let i = 0; i < store.databases.length; i++) {
        const isSelected = store.databases[i].name === dbName;
        setStore("databases", i, "isSelected", isSelected);
      }
    });
  };

  return (
    <SidebarContext.Provider
      value={{
        sidebar: store,
        openSidebar,
        closeSidebar,
        toggleSelectedDatabase,
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
  toggleSelectedDatabase: (dbName: string) => void;
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
