import {
  batch,
  createContext,
  createEffect,
  FlowProps,
  onMount,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { useOriginContext } from "@/devtools/components/origin-context";
import {
  DEFAULT_AUTOSIZE_COLUMNS,
  DEFAULT_OBJECTS_COUNT,
  DEFAULT_PAGINATION,
  deleteSavedOriginSettings,
  getPaginationAndSizingSettings,
  originHasSavedSettings,
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
  const [settings, setSettings] = createStore<TableSettings>(
    getInitialSettingsValue(),
  );
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
          setSettings("objectsCount", values.objectsCount);
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
        settings.objectsCount,
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
  const setObjectsCount = (value: number | null) => {
    setSettings("objectsCount", value);
    _saveToLocalStorage();
  };

  const hasSavedSettings = () => {
    const currentOrigin = origin();
    const activeStore = activeObjectStore();

    return (
      !!currentOrigin &&
      !!activeStore &&
      originHasSavedSettings(
        currentOrigin,
        activeStore.dbName,
        activeStore.storeName,
      )
    );
  };
  const { refetch } = useTableContext();
  const deleteSavedSettings = () => {
    const currentOrigin = origin();
    const activeStore = activeObjectStore();
    if (currentOrigin && activeStore) {
      deleteSavedOriginSettings(
        currentOrigin,
        activeStore.dbName,
        activeStore.storeName,
      );
      // reset table settings and refetch table data to reset columns state
      setSettings(getInitialSettingsValue());
      refetch();
    }
  };

  // reset the search term on store change
  createEffect(() => {
    activeObjectStore();
    setSettings("searchTerm", "");
  });

  return (
    <TableSettingsContext.Provider
      value={{
        settings,
        setSearchTerm,
        togglePagination,
        setObjectsCount,
        setAutosizeColumns,
        hasSavedSettings,
        deleteSavedSettings,
      }}
    >
      {props.children}
    </TableSettingsContext.Provider>
  );
}

function getInitialSettingsValue(): TableSettings {
  return {
    searchTerm: "",
    pagination: DEFAULT_PAGINATION,
    autosizeColumns: DEFAULT_AUTOSIZE_COLUMNS,
    objectsCount: DEFAULT_OBJECTS_COUNT,
  };
}

interface TableSettingsContextType {
  settings: TableSettings;
  setSearchTerm: (term: string) => void;
  togglePagination: (value: boolean) => void;
  setObjectsCount: (value: number | null) => void;
  setAutosizeColumns: (value: AutosizeColumns) => void;
  hasSavedSettings: () => boolean;
  deleteSavedSettings: () => void;
}

interface TableSettings {
  searchTerm: string;
  pagination: boolean;
  objectsCount: number | null;
  autosizeColumns: AutosizeColumns;
}
