import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const TableSettingsContext = createContext<TableSettingsContextType>();

export function useTableSettingsContext() {
  const context = useContext(TableSettingsContext);
  if (!context) {
    const msg = "useTableSettingsContext: cannot find TableSettingsContext";
    throw new Error(msg);
  }

  return context;
}

export function TableSettingsContextProvider(props: FlowProps) {
  const [settings, setSettings] = createStore({
    searchTerm: "",
  });

  const setSearchTerm = (term: string) => setSettings("searchTerm", term);

  return (
    <TableSettingsContext.Provider value={{ settings, setSearchTerm }}>
      {props.children}
    </TableSettingsContext.Provider>
  );
}

interface TableSettingsContextType {
  settings: { searchTerm: string };
  setSearchTerm: (term: string) => void;
}
