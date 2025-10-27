import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import { AutosizeColumns } from "@/devtools/utils/types";

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
  const [settings, setSettings] = createStore<TableSettings>({
    searchTerm: "",
    pagination: true,
    autosizeColumns: "fit-grid-width",
  });

  const setSearchTerm = (term: string) => setSettings("searchTerm", term);
  const togglePagination = (value: boolean) => setSettings("pagination", value);
  const setAutosizeColumns = (value: AutosizeColumns) => {
    setSettings("autosizeColumns", value);
  };

  return (
    <TableSettingsContext.Provider
      value={{ settings, setSearchTerm, togglePagination, setAutosizeColumns }}
    >
      {props.children}
    </TableSettingsContext.Provider>
  );
}

interface TableSettingsContextType {
  settings: TableSettings;
  setSearchTerm: (term: string) => void;
  togglePagination: (value: boolean) => void;
  setAutosizeColumns: (value: AutosizeColumns) => void;
}

interface TableSettings {
  searchTerm: string;
  pagination: boolean;
  autosizeColumns: AutosizeColumns;
}
