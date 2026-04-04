import { FilterModel, SortDef } from "ag-grid-community";
import { createContext, createEffect, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useOriginContext } from "@/devtools/components/origin-context";
import { useTableReloadContext } from "@/devtools/components/table-reload-context";
import {
  DEFAULT_AUTOSIZE_COLUMNS,
  DEFAULT_OBJECTS_COUNT,
  DEFAULT_PAGE_SIZE,
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
  // on store change, reset in-memory settings and load persistent settings (if any)
  // from local storage
  createEffect(() => {
    const currentOrigin = origin();
    const activeStore = activeObjectStore();
    if (currentOrigin && activeStore) {
      const initialValues = getInitialSettingsValue();
      const savedValues = getPaginationAndSizingSettings(
        currentOrigin,
        activeStore.dbName,
        activeStore.storeName,
      );
      if (savedValues) {
        setSettings({ ...initialValues, ...savedValues });
      } else {
        setSettings(initialValues);
      }
    }
  });

  const setSearchTerm = (term: string) => setSettings("searchTerm", term);
  const setColumnFilters = (filters: FilterModel) =>
    setSettings("columnFilters", filters);
  const setSort = (sort: ColumnSort[]) => setSettings("sort", sort);
  const _saveToLocalStorage = () => {
    const currentOrigin = origin();
    const activeStore = activeObjectStore();
    if (currentOrigin && activeStore) {
      savePaginationAndSizingSettings(
        currentOrigin,
        activeStore.dbName,
        activeStore.storeName,
        settings.pagination,
        settings.pageSize,
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
  const setPageSize = (value: number) => {
    setSettings("pageSize", value);
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
  const { reloadTableData } = useTableReloadContext();
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
      reloadTableData();
    }
  };

  return (
    <TableSettingsContext.Provider
      value={{
        settings,
        setSearchTerm,
        setColumnFilters,
        setSort,
        togglePagination,
        setObjectsCount,
        setPageSize,
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
    columnFilters: {},
    sort: [],
    pagination: DEFAULT_PAGINATION,
    autosizeColumns: DEFAULT_AUTOSIZE_COLUMNS,
    objectsCount: DEFAULT_OBJECTS_COUNT,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

interface TableSettingsContextType {
  settings: TableSettings;
  setSearchTerm: (term: string) => void;
  setColumnFilters: (filters: FilterModel) => void;
  setSort: (sort: ColumnSort[]) => void;
  togglePagination: (value: boolean) => void;
  setObjectsCount: (value: number | null) => void;
  setPageSize: (value: number) => void;
  setAutosizeColumns: (value: AutosizeColumns) => void;
  hasSavedSettings: () => boolean;
  deleteSavedSettings: () => void;
}

interface TableSettings {
  // in-memory settings: retained when the user reloads the store data but are
  // reset when the object store changes
  searchTerm: string;
  columnFilters: FilterModel;
  sort: ColumnSort[];
  // persistent settings: saved to local storage to be loaded when the user
  // comes back to view the same object store
  pagination: boolean;
  pageSize: number;
  objectsCount: number | null;
  autosizeColumns: AutosizeColumns;
}

interface ColumnSort {
  column: string;
  def: SortDef | null;
}
