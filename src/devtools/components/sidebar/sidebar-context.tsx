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
  const [store, setStore] = createStore({ isOpen: getSidebarState() });
  const openSidebar = () => {
    setStore({ isOpen: true });
    storeSidebarState(true);
  };
  const closeSidebar = () => {
    setStore({ isOpen: false });
    storeSidebarState(false);
  };

  return (
    <SidebarContext.Provider
      value={{ sidebar: store, openSidebar, closeSidebar }}
    >
      {props.children}
    </SidebarContext.Provider>
  );
}

function storeSidebarState(isOpen: boolean) {
  localStorage.setItem("sidebar-state", isOpen ? "open" : "closed");
}

function getSidebarState() {
  const state = localStorage.getItem("sidebar-state");
  // default to an open sidebar
  return state !== "closed";
}

interface SidebarContextType {
  sidebar: { isOpen: boolean };
  openSidebar: () => void;
  closeSidebar: () => void;
}
