import {
  ActiveObjectStore,
  AutosizeColumns,
  TABLE_COLUMN_DATATYPES,
  TableColumn,
  TableColumnDatatype,
} from "@/devtools/utils/types";

export function getLastViewedStore(origin: string): ActiveObjectStore | null {
  const settings = getOriginSettings(origin);
  if (!settings.lastViewedStore) return null;

  try {
    const { dbName, storeName } = settings.lastViewedStore;
    return { dbName, storeName };
  } catch (e) {
    console.error("last-viewed-store: failure to load saved value", e);
    return null;
  }
}

export function saveLastViewedStore(
  origin: string,
  dbName: string,
  storeName: string,
) {
  const settings = getOriginSettings(origin);
  settings.lastViewedStore = { dbName, storeName };
  saveOriginSettings(origin, settings);
}

export function getPaginationAndSizingSettings(
  origin: string,
  dbName: string,
  storeName: string,
): {
  enablePagination: boolean;
  objectsCount: number | null;
  autosizeColumns: AutosizeColumns;
} | null {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);
  const store = getStore(stores, dbName, storeName);
  if (!store) return null;

  const autosizeColumns: AutosizeColumns =
    store.autosizeColumns === "fit-cell-contents"
      ? "fit-cell-contents"
      : "fit-grid-width";
  const objectsCount =
    typeof store.objectsCount === "number" ? store.objectsCount : null;
  return {
    enablePagination: !!store.enablePagination,
    objectsCount,
    autosizeColumns,
  };
}

export function savePaginationAndSizingSettings(
  origin: string,
  dbName: string,
  storeName: string,
  enablePagination: boolean,
  objectsCount: number | null,
  autosizeColumns: AutosizeColumns,
) {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);
  const store = getStore(stores, dbName, storeName);
  if (store) {
    store.enablePagination = enablePagination;
    store.objectsCount = objectsCount;
    store.autosizeColumns = autosizeColumns;
  } else {
    stores.push({
      dbName,
      storeName,
      enablePagination,
      objectsCount,
      autosizeColumns,
      columns: [],
    });
  }
  originSettings.stores = stores;
  saveOriginSettings(origin, originSettings);
}

export function getColumnsConfig(
  origin: string,
  dbName: string,
  storeName: string,
): TableColumn[] {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);
  const store = getStore(stores, dbName, storeName);
  if (!store) return [];

  const columns: TableColumn[] = [];
  try {
    for (const column of store.columns) {
      const { name, isKey, isVisible, datatype } = column;
      const colDatatype: TableColumnDatatype = TABLE_COLUMN_DATATYPES.includes(
        datatype,
      )
        ? datatype
        : "unsupported";
      columns.push({
        name,
        isKey: !!isKey,
        isVisible: !!isVisible,
        datatype: colDatatype,
      });
    }
  } catch (e) {
    console.error("columns-config: failure to load saved value", e);
  }
  return columns;
}

export function saveColumnsConfig(
  origin: string,
  dbName: string,
  storeName: string,
  columns: TableColumn[],
) {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);
  const store = getStore(stores, dbName, storeName);
  if (store) {
    store.columns = columns;
  } else {
    stores.push({
      dbName,
      storeName,
      enablePagination: DEFAULT_PAGINATION,
      autosizeColumns: DEFAULT_AUTOSIZE_COLUMNS,
      objectsCount: DEFAULT_OBJECTS_COUNT,
      columns,
    });
  }
  originSettings.stores = stores;
  saveOriginSettings(origin, originSettings);
}

export function originHasSavedSettings(
  origin: string,
  dbName: string,
  storeName: string,
) {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);
  return !!getStore(stores, dbName, storeName);
}

export function deleteSavedOriginSettings(
  origin: string,
  dbName: string,
  storeName: string,
) {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);

  originSettings.stores = stores.filter(
    (store) => store.dbName !== dbName && store.storeName !== storeName,
  );
  saveOriginSettings(origin, originSettings);
}

function getStore(
  savedStores: SavedStoreSettings[],
  dbName: string,
  storeName: string,
) {
  for (const store of savedStores) {
    if (store.dbName === dbName && store.storeName === storeName) {
      return store;
    }
  }
  return null;
}

function getStores(
  savedOriginSettings: SavedOriginSettings,
): SavedStoreSettings[] {
  const stores: SavedStoreSettings[] = [];
  try {
    for (const store of savedOriginSettings.stores) {
      const {
        dbName,
        storeName,
        enablePagination,
        objectsCount,
        autosizeColumns,
        columns,
      } = store;
      stores.push({
        dbName,
        storeName,
        enablePagination,
        objectsCount,
        autosizeColumns,
        columns,
      });
    }
  } catch (e) {
    console.error("stores-settings: failure to load the saved value", e);
  }
  return stores;
}

function getOriginSettings(origin: string): SavedOriginSettings {
  const defaultSettings = { lastViewedStore: null, stores: [] };
  const settingsString = localStorage.getItem(origin);
  if (!settingsString) return defaultSettings;

  try {
    const settings = JSON.parse(settingsString);
    return {
      lastViewedStore: settings.lastViewedStore,
      stores: settings.stores,
    };
  } catch (e) {
    console.error("origin-settings: failure to load saved settings", e);
    return defaultSettings;
  }
}

function saveOriginSettings(origin: string, settings: OriginSettings) {
  localStorage.setItem(origin, JSON.stringify(settings));
}

export const DEFAULT_PAGINATION = true;
export const DEFAULT_AUTOSIZE_COLUMNS = "fit-grid-width";
export const DEFAULT_OBJECTS_COUNT = null;

interface OriginSettings {
  lastViewedStore: ActiveObjectStore | null;
  stores: StoreSettings[];
}

interface StoreSettings extends ActiveObjectStore {
  enablePagination: boolean;
  autosizeColumns: AutosizeColumns;
  objectsCount: number | null;
  columns: TableColumn[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any;

interface SavedOriginSettings {
  lastViewedStore: ANY;
  stores: ANY;
}

interface SavedStoreSettings {
  dbName: ANY;
  storeName: ANY;
  enablePagination: ANY;
  objectsCount: ANY;
  autosizeColumns: ANY;
  columns: ANY;
}
