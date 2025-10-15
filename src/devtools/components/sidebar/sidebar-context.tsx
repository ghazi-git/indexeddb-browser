import { createContext, FlowProps, useContext } from "solid-js";
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
  const [store, setStore] = createStore({ isOpen: state.isOpen });
  const openSidebar = () => {
    setStore("isOpen", true);
    storeSidebarState(store);
  };
  const closeSidebar = () => {
    setStore("isOpen", false);
    storeSidebarState(store);
  };

  return (
    <SidebarContext.Provider
      value={{ sidebar: store, openSidebar, closeSidebar }}
    >
      {props.children}
    </SidebarContext.Provider>
  );
}

function storeSidebarState(state: SidebarState) {
  const toStore = { isOpen: state.isOpen };
  localStorage.setItem("sidebar-state", JSON.stringify(toStore));
}

function getSidebarState(): SidebarState {
  const defaultState = { isOpen: true };
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
  sidebar: SidebarState;
  openSidebar: () => void;
  closeSidebar: () => void;
}

interface SidebarState {
  isOpen: boolean;
}
