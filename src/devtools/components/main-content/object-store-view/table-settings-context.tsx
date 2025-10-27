import { batch, createContext, FlowProps, onMount, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useOriginContext } from "@/devtools/components/origin-context";
import {
  DEFAULT_AUTOSIZE_COLUMNS,
  DEFAULT_PAGINATION,
  getPaginationAndSizingSettings,
  savePaginationAndSizingSettings,
} from "@/devtools/utils/saved-settings";
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
    pagination: DEFAULT_PAGINATION,
    autosizeColumns: DEFAULT_AUTOSIZE_COLUMNS,
  });
  const { origin } = useOriginContext();
  const { activeObjectStore } = useActiveObjectStoreContext();
  onMount(() => {
    const currentOrigin = origin();
    const activeStore = activeObjectStore();
    if (currentOrigin && activeStore) {
      const values = getPaginationAndSizingSettings(
        currentOrigin,
        activeStore.dbName,
        activeStore.storeName,
      );
      if (values) {
        batch(() => {
          setSettings("pagination", values.enablePagination);
          setSettings("autosizeColumns", values.autosizeColumns);
        });
      }
    }
  });

  const setSearchTerm = (term: string) => setSettings("searchTerm", term);
  const _saveToLocalStorage = () => {
    const currentOrigin = origin();
    const activeStore = activeObjectStore();
    if (currentOrigin && activeStore) {
      savePaginationAndSizingSettings(
        currentOrigin,
        activeStore.dbName,
        activeStore.storeName,
        settings.pagination,
        settings.autosizeColumns,
      );
    }
  };
  const togglePagination = (value: boolean) => {
    setSettings("pagination", value);
    _saveToLocalStorage();
  };
  const setAutosizeColumns = (value: AutosizeColumns) => {
    setSettings("autosizeColumns", value);
    _saveToLocalStorage();
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
