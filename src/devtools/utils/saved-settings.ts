import {
  ActiveObjectStore,
  AutosizeColumns,
  TABLE_COLUMN_DATATYPES,
  TableColumn,
  TableColumnDatatype,
} from "@/devtools/utils/types";

export function getLastViewedStore(origin: string): ActiveObjectStore | null {
  const settings = getOriginSettings(origin);

  try {
    const { dbName, storeName, indexName } = settings.lastViewedStore;
    if (
      typeof dbName === "string" &&
      typeof storeName === "string" &&
      // `==null` instead of `===null` to account for existing saved data before
      // adding the ability to show index data in the extension
      (typeof indexName === "string" || indexName == null)
    )
      return { dbName, storeName, indexName: indexName ?? null };
  } catch {}
  return null;
}

export function saveLastViewedStore(origin: string, store: ActiveObjectStore) {
  const settings = getOriginSettings(origin);
  settings.lastViewedStore = store;
  saveOriginSettings(origin, settings);
}

export function getTableSettings(
  origin: string,
  store: ActiveObjectStore,
): {
  enablePagination: boolean;
  pageSize: number;
  objectsCount: number | null;
  autosizeColumns: AutosizeColumns;
  tryTableView: boolean;
} | null {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);
  const savedStore = getStore(stores, store);
  if (!savedStore) return null;

  const autosizeColumns: AutosizeColumns =
    savedStore.autosizeColumns === "fit-cell-contents"
      ? "fit-cell-contents"
      : "fit-grid-width";
  const objectsCount =
    typeof savedStore.objectsCount === "number"
      ? savedStore.objectsCount
      : null;
  const pageSize =
    typeof savedStore.pageSize === "number"
      ? savedStore.pageSize
      : DEFAULT_PAGE_SIZE;
  return {
    enablePagination: !!savedStore.enablePagination,
    pageSize,
    objectsCount,
    autosizeColumns,
    tryTableView: !!savedStore.tryTableView,
  };
}

export function saveTableSettings(
  origin: string,
  store: ActiveObjectStore,
  enablePagination: boolean,
  pageSize: number,
  objectsCount: number | null,
  autosizeColumns: AutosizeColumns,
  tryTableView: boolean,
) {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);
  const savedStore = getStore(stores, store);
  if (savedStore) {
    savedStore.enablePagination = enablePagination;
    savedStore.pageSize = pageSize;
    savedStore.objectsCount = objectsCount;
    savedStore.autosizeColumns = autosizeColumns;
    savedStore.tryTableView = tryTableView;
  } else {
    stores.push({
      dbName: store.dbName,
      storeName: store.storeName,
      indexName: store.indexName,
      enablePagination,
      pageSize,
      objectsCount,
      autosizeColumns,
      tryTableView,
      columns: [],
    });
  }
  originSettings.stores = stores;
  saveOriginSettings(origin, originSettings);
}

export function getColumnsConfig(
  origin: string,
  store: ActiveObjectStore,
): TableColumn[] {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);
  const savedStore = getStore(stores, store);
  if (!savedStore) return [];

  const columns: TableColumn[] = [];
  try {
    for (const column of savedStore.columns) {
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
  store: ActiveObjectStore,
  columns: TableColumn[],
) {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);
  const savedStore = getStore(stores, store);
  if (savedStore) {
    savedStore.columns = columns;
  } else {
    stores.push({
      dbName: store.dbName,
      storeName: store.storeName,
      indexName: store.indexName,
      enablePagination: DEFAULT_PAGINATION,
      pageSize: DEFAULT_PAGE_SIZE,
      autosizeColumns: DEFAULT_AUTOSIZE_COLUMNS,
      objectsCount: DEFAULT_OBJECTS_COUNT,
      tryTableView: DEFAULT_TRY_TABLE_VIEW,
      columns,
    });
  }
  originSettings.stores = stores;
  saveOriginSettings(origin, originSettings);
}

export function originHasSavedSettings(
  origin: string,
  store: ActiveObjectStore,
) {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);
  return !!getStore(stores, store);
}

export function deleteSavedOriginSettings(
  origin: string,
  store: ActiveObjectStore,
) {
  const originSettings = getOriginSettings(origin);
  const stores = getStores(originSettings);

  originSettings.stores = stores.filter(
    (s) =>
      s.dbName !== store.dbName ||
      s.storeName !== store.storeName ||
      s.indexName !== store.indexName,
  );
  saveOriginSettings(origin, originSettings);
}

function getStore(savedStores: SavedStoreSettings[], store: ActiveObjectStore) {
  for (const saved of savedStores) {
    if (
      saved.dbName === store.dbName &&
      saved.storeName === store.storeName &&
      saved.indexName === store.indexName
    ) {
      return saved;
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
        indexName,
        enablePagination,
        pageSize,
        objectsCount,
        autosizeColumns,
        columns,
        tryTableView,
      } = store;
      stores.push({
        dbName,
        storeName,
        indexName,
        enablePagination,
        pageSize,
        objectsCount,
        autosizeColumns,
        columns,
        tryTableView,
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
export const PAGE_SIZES = [20, 100, 500, 1000];
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];
export const DEFAULT_AUTOSIZE_COLUMNS = "fit-grid-width";
export const DEFAULT_OBJECTS_COUNT = null;
export const DEFAULT_TRY_TABLE_VIEW = true;

interface OriginSettings {
  lastViewedStore: ActiveObjectStore | null;
  stores: StoreSettings[];
}

interface StoreSettings extends ActiveObjectStore {
  enablePagination: boolean;
  pageSize: number;
  autosizeColumns: AutosizeColumns;
  objectsCount: number | null;
  columns: TableColumn[];
  tryTableView: boolean;
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
  indexName: ANY;
  enablePagination: ANY;
  pageSize: ANY;
  objectsCount: ANY;
  autosizeColumns: ANY;
  tryTableView: ANY;
  columns: ANY;
}
