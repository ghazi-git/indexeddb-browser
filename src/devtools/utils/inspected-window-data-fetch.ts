import { DATA_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import {
  ActiveObjectStore,
  DBRecord,
  IndexData,
  IndexRow,
  InspectedWindowTableData,
  ObjectStoreData,
  ObjectStoreResponse,
  OutOfLineRecord,
  TableColumn,
  TableColumnDatatype,
  TableColumnValue,
  TableRow,
  ViewType,
} from "@/devtools/utils/types";

export function triggerDataFetching(
  requestID: string,
  activeStore: ActiveObjectStore,
  savedColumns: TableColumn[] | undefined,
  objectsCount: number | undefined,
  tryTableView: boolean,
) {
  const code = getDataRequestCode(
    requestID,
    activeStore,
    savedColumns,
    objectsCount,
    tryTableView,
  );
  return new Promise<void>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (_, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("fetch-data: failure to trigger fetching", exceptionInfo);
        reject(new Error(DATA_ERROR_MSG));
      } else {
        resolve();
      }
    });
  });
}

function getDataRequestCode(
  requestID: string,
  activeStore: ActiveObjectStore,
  savedColumns: TableColumn[] | undefined,
  objectsCount: number | undefined,
  tryTableView: boolean,
) {
  const serializedRequestID = JSON.stringify(requestID);
  const serializedActiveStore = JSON.stringify(activeStore);
  const serializedColumns = JSON.stringify(savedColumns);
  const serializedCount = JSON.stringify(objectsCount);
  const serializedTableView = JSON.stringify(tryTableView);

  return `
(function() {
  ${processDataRequest.name}(${serializedRequestID}, ${serializedActiveStore}, ${serializedColumns}, ${serializedCount}, ${serializedTableView})

  ${processDataRequest.toString()}
  ${validateDBName.toString()}
  ${getTableDataFromObjectStore.toString()}
  ${getObjectStoreData.toString()}
  ${trackRequestStatus.toString()}
  ${clearTimerAndCloseDB.toString()}
  ${markRequestInProgress.toString()}
  ${markRequestAsSuccessful.toString()}
  ${markRequestAsFailed.toString()}
  ${cleanupData.toString()}
  ${isRequestActive.toString()}
  ${getColumns.toString()}
  ${determineColumnNames.toString()}
  ${autodetectColumnsDatatypes.toString()}
  ${determineColumnDatatype.toString()}
  ${getOutOfLineStoreColumns.toString()}
  ${determineViewType.toString()}
  ${getOutOfLineKeyColumn.toString()}
  ${getTableDataFromIndex.toString()}
  ${getIndexData.toString()}
  ${getKeypathAndValues.toString()}
  ${getIndexColumns.toString()}
  ${getStrings.toString()}
  ${isString.toString()}
  ${getTimestamps.toString()}
  ${isTimestamp.toString()}
  ${getDates.toString()}
  ${isDate.toString()}
  ${getNumbers.toString()}
  ${isNumber.toString()}
  ${getBooleans.toString()}
  ${isBoolean.toString()}
  ${getBigInts.toString()}
  ${isBigint.toString()}
  ${getJSONData.toString()}
  ${isJSON.toString()}
  ${isArray.toString()}
  ${isObject.toString()}
  ${hasHighPercentage.toString()}
  ${canUseSavedColumns.toString()}
  ${convertStoreData.toString()}
})()
`;
}

async function processDataRequest(
  requestID: string,
  activeStore: ActiveObjectStore,
  savedColumns: TableColumn[] | undefined,
  objectsCount: number | undefined,
  tryTableView: boolean,
) {
  markRequestInProgress(requestID);
  try {
    await validateDBName(activeStore.dbName);
  } catch (e) {
    console.error("fetch-data: failure", e);
    const defaultMsg =
      "An unexpected error occurred. Please try fetching the object store " +
      "data again by clicking the reload icon in the header.";
    const msg = e instanceof Error ? e.message : defaultMsg;
    markRequestAsFailed(requestID, msg);
    return;
  }

  try {
    let tableData: InspectedWindowTableData;
    if (activeStore.indexName) {
      tableData = await getTableDataFromIndex(
        requestID,
        activeStore.dbName,
        activeStore.storeName,
        activeStore.indexName,
        savedColumns,
        objectsCount,
      );
    } else {
      tableData = await getTableDataFromObjectStore(
        requestID,
        activeStore,
        savedColumns,
        objectsCount,
        tryTableView,
      );
    }
    markRequestAsSuccessful(requestID, tableData);
  } catch (e) {
    console.error("fetch-data: failure", e);
    const msg =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred. Please try fetching the object " +
          "store data again by clicking the reload icon in the header.";
    markRequestAsFailed(requestID, msg);
  }
}

async function validateDBName(dbName: string) {
  // make sure the database exists to avoid creating a new one when opening
  // a connection
  const databases = await indexedDB.databases();
  const db = databases.find((db) => db.name === dbName);
  if (!db) {
    throw new Error(`The database "${dbName}" was not found.`);
  }
}

async function getTableDataFromObjectStore(
  requestID: string,
  activeStore: ActiveObjectStore,
  savedColumns: TableColumn[] | undefined,
  objectsCount: number | undefined,
  tryTableView: boolean,
): Promise<InspectedWindowTableData> {
  const { keyType, keypath, autoincrement, values } = await getObjectStoreData(
    requestID,
    activeStore.dbName,
    activeStore.storeName,
    objectsCount,
  );

  // determine viewType and columns based on the first 100 objects
  const viewType =
    keyType === "inLine"
      ? "tableView"
      : tryTableView
        ? determineViewType(values.slice(0, 100))
        : "keyValueView";
  let columns =
    keyType === "inLine"
      ? getColumns(keypath, values.slice(0, 100))
      : getOutOfLineStoreColumns(values.slice(0, 100), viewType);
  if (savedColumns && canUseSavedColumns(columns, savedColumns)) {
    columns = savedColumns;
  }
  let data = values;
  if (keyType === "outOfLine" && viewType === "tableView") {
    // ignore non-object store values since we decided on a tableView
    data = values
      .filter(({ value }) => isObject(value))
      .map(({ key, value }) => ({ key, ...value }));
  }
  const rows = convertStoreData(columns, data);
  // prettier-ignore
  return { keyType, viewType, keypath, autoincrement, columns, rows, activeStore };
}

function getObjectStoreData(
  requestID: string,
  dbName: string,
  storeName: string,
  objectsCount: number | undefined,
) {
  let tx: IDBTransaction;
  const timerID = trackRequestStatus(requestID, () => tx?.abort());

  return new Promise<ObjectStoreData>((resolve, reject) => {
    const dbRequest = indexedDB.open(dbName);
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const msg = `The object store "${storeName}" was not found.`;
        reject(new Error(msg));
        clearTimerAndCloseDB(timerID, db);
        return;
      }

      tx = db.transaction(storeName, "readonly");
      tx.onerror = () => {
        console.error("fetch-data", tx.error);
        const msg =
          "An unexpected error occurred. Please try fetching the object store " +
          "data again by clicking the reload icon in the header.";
        reject(new Error(msg));
      };
      tx.onabort = () => {
        reject(new Error("Request timed out or canceled."));
        clearTimerAndCloseDB(timerID, db);
      };
      tx.oncomplete = () => clearTimerAndCloseDB(timerID, db);

      const objectStore = tx.objectStore(storeName);
      if (objectStore.keyPath) {
        const keypath =
          typeof objectStore.keyPath === "string"
            ? [objectStore.keyPath]
            : objectStore.keyPath;
        const getAllReq = objectStore.getAll(null, objectsCount);
        getAllReq.onsuccess = () => {
          resolve({
            keyType: "inLine",
            keypath,
            autoincrement: objectStore.autoIncrement,
            values: getAllReq.result,
          });
        };
      } else {
        // @ts-expect-error getAllRecords types not yet recognized by typescript
        const getAllReq = objectStore.getAllRecords({ count: objectsCount });
        getAllReq.onsuccess = () => {
          resolve({
            keyType: "outOfLine",
            keypath: ["key"],
            autoincrement: objectStore.autoIncrement,
            values: (getAllReq.result as DBRecord[]).map(({ key, value }) => ({
              key,
              value,
            })),
          });
        };
      }
    };
  });
}

function trackRequestStatus(requestID: string, callback: () => void) {
  const startTime = Date.now();
  return setInterval(() => {
    // for requests to get a lot of data, we have this interval timer that
    // aborts the transaction if it takes too long or the request was canceled
    if (
      !isRequestActive(requestID) ||
      Date.now() - startTime > 30_000 + 3_000
    ) {
      callback();
    }
  }, 1000);
}

function clearTimerAndCloseDB(timer: number, db: IDBDatabase) {
  clearInterval(timer);
  db.close();
}

function markRequestInProgress(requestID: string) {
  window.__indexeddb_browser_data = {
    requestID,
    status: "in_progress",
    data: null,
    errorMsg: null,
  };
}

function markRequestAsSuccessful(
  requestID: string,
  data: InspectedWindowTableData,
) {
  if (isRequestActive(requestID)) {
    window.__indexeddb_browser_data = {
      requestID,
      status: "success",
      data,
      errorMsg: null,
    };
    cleanupData(requestID);
  }
}

function markRequestAsFailed(requestID: string, reason: string) {
  if (isRequestActive(requestID)) {
    window.__indexeddb_browser_data = {
      requestID,
      status: "failure",
      data: null,
      errorMsg: reason,
    };
    cleanupData(requestID);
  }
}

function cleanupData(requestID: string) {
  setTimeout(() => {
    if (isRequestActive(requestID)) {
      delete window.__indexeddb_browser_data;
    }
  }, 10_000);
}

function isRequestActive(requestID: string) {
  // request is considered until the user fetches data again or for another
  // object store. These actions change the requestID
  return window.__indexeddb_browser_data?.requestID === requestID;
}

function getColumns(keypath: string[], rows: TableRow[]) {
  // order columns: keys first according to the keypath ordering,
  // then the rest alphabetically
  const keyColumns: TableColumn[] = keypath.map((key) => ({
    name: key,
    isKey: true,
    isVisible: false,
    datatype: "unsupported",
  }));
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  const colNames = determineColumnNames(rows);
  const otherColumns: TableColumn[] = colNames
    .filter((col) => !keypath.includes(col))
    .toSorted(collator.compare)
    .map((name) => ({
      name,
      isKey: false,
      isVisible: false,
      datatype: "unsupported",
    }));
  const columns = keyColumns.concat(otherColumns);

  autodetectColumnsDatatypes(rows, columns);
  return columns;
}

function determineColumnNames(rows: TableRow[]) {
  // determine column names based on the first 10 rows
  const first10Rows = rows.slice(0, 10);
  const uniqueColumns = new Set(first10Rows.flatMap(Object.keys));
  return [...uniqueColumns];
}

/**
 * Auto-detect columns datatypes based on non-null data: At least 80% of the
 * column data should match the datatype. Users will be able to manually set
 * the column datatype from the UI in case auto-detection doesn't work as expected
 */
function autodetectColumnsDatatypes(objs: TableRow[], columns: TableColumn[]) {
  const columnNames = columns.map(({ name }) => name);
  const nonNullishData: Record<string, TableColumnValue[]> = {};
  for (const name of columnNames) {
    nonNullishData[name] = objs
      .map((row) => row[name])
      .filter((value) => value != null);
  }
  for (const column of columns) {
    const columnData = nonNullishData[column.name];
    const datatype = determineColumnDatatype(columnData, 80);
    column.datatype = datatype;
    column.isVisible = datatype !== "unsupported";
  }
}

function determineColumnDatatype(
  columnData: TableColumnValue[],
  percent: number,
): TableColumnDatatype {
  if (hasHighPercentage(columnData, getStrings(columnData), percent)) {
    return "string";
  } else if (
    hasHighPercentage(columnData, getTimestamps(columnData), percent)
  ) {
    return "timestamp";
  } else if (hasHighPercentage(columnData, getNumbers(columnData), percent)) {
    return "number";
  } else if (hasHighPercentage(columnData, getBooleans(columnData), percent)) {
    return "boolean";
  } else if (hasHighPercentage(columnData, getBigInts(columnData), percent)) {
    return "bigint";
  } else if (hasHighPercentage(columnData, getDates(columnData), percent)) {
    return "date";
  } else if (hasHighPercentage(columnData, getJSONData(columnData), percent)) {
    return "json_data";
  } else {
    return "unsupported";
  }
}

function getOutOfLineStoreColumns(
  records: OutOfLineRecord[],
  viewType: ViewType,
): TableColumn[] {
  if (records.length === 0) return [];

  let valueColumns: TableColumn[];
  if (viewType === "tableView") {
    const values = records.map(({ value }) => value);
    const colNames = determineColumnNames(values);
    valueColumns = colNames.map((prop) => ({
      name: prop,
      isKey: false,
      isVisible: false,
      datatype: "unsupported",
    }));
    autodetectColumnsDatatypes(values, valueColumns);
  } else {
    valueColumns = [
      {
        name: "value",
        isKey: false,
        isVisible: false,
        datatype: "unsupported",
      },
    ];
    autodetectColumnsDatatypes(records, valueColumns);
  }
  const keyColumn = getOutOfLineKeyColumn(records);
  return [keyColumn, ...valueColumns];
}

function getOutOfLineKeyColumn(records: OutOfLineRecord[]): TableColumn {
  const keys = records.map(({ key }) => key);
  // key column: all values should match the datatype.
  const keyDatatype = determineColumnDatatype(keys, 100);
  return {
    name: "key",
    isKey: true,
    isVisible: keyDatatype !== "unsupported",
    datatype: keyDatatype,
  };
}

/**
 * display store data similar to stores with in-line keys if:
 * - all store values are object literals
 * - there is no property named `key` (that name is reserved for the value
 * of the out-of-line key)
 */
function determineViewType(records: OutOfLineRecord[]): ViewType {
  const values = records.map(({ value }) => value);
  if (values.length === 0 || !values.every(isObject)) return "keyValueView";

  const colNames = determineColumnNames(values);
  return colNames.length > 0 && !colNames.includes("key")
    ? "tableView"
    : "keyValueView";
}

async function getTableDataFromIndex(
  requestID: string,
  dbName: string,
  storeName: string,
  indexName: string,
  savedColumns: TableColumn[] | undefined,
  objectsCount: number | undefined,
): Promise<InspectedWindowTableData> {
  const { keyType, keypath, autoincrement, values } = await getIndexData(
    requestID,
    dbName,
    storeName,
    indexName,
    objectsCount,
  );

  let columns = getIndexColumns(keypath, values.slice(0, 100));
  if (savedColumns && canUseSavedColumns(columns, savedColumns)) {
    columns = savedColumns;
  }
  const rows = convertStoreData(columns, values);
  return {
    keyType,
    viewType: "keyValueView",
    keypath,
    autoincrement,
    columns,
    rows,
    activeStore: { dbName, storeName, indexName },
  };
}

function getIndexData(
  requestID: string,
  dbName: string,
  storeName: string,
  indexName: string,
  objectsCount: number | undefined,
) {
  let tx: IDBTransaction;
  const timerID = trackRequestStatus(requestID, () => tx?.abort());

  return new Promise<IndexData>((resolve, reject) => {
    const dbRequest = indexedDB.open(dbName);
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      if (!db.objectStoreNames.contains(storeName)) {
        reject(new Error(`The object store "${storeName}" was not found.`));
        clearTimerAndCloseDB(timerID, db);
        return;
      }

      tx = db.transaction(storeName);
      tx.onerror = () => {
        console.error("fetch-data", tx.error);
        const msg =
          "An unexpected error occurred. Please try fetching the index " +
          "data again by clicking the reload icon in the header.";
        reject(new Error(msg));
      };
      tx.onabort = () => {
        reject(new Error("Request timed out or canceled."));
        clearTimerAndCloseDB(timerID, db);
      };
      tx.oncomplete = () => clearTimerAndCloseDB(timerID, db);

      const objectStore = tx.objectStore(storeName);
      if (!objectStore.indexNames.contains(indexName)) {
        reject(new Error(`The index "${indexName}" was not found.`));
        clearTimerAndCloseDB(timerID, db);
        return;
      }

      const index = objectStore.index(indexName);
      const indexKeypath =
        typeof index.keyPath === "string" ? [index.keyPath] : index.keyPath;

      // @ts-expect-error getAllRecords types not yet recognized by typescript
      const req = index.getAllRecords({ count: objectsCount });
      req.onsuccess = () => {
        const records = req.result as DBRecord[];
        const { keypath, values } = getKeypathAndValues(indexKeypath, records);
        const keyType = objectStore.keyPath ? "inLine" : "outOfLine";
        const autoincrement = objectStore.autoIncrement;
        resolve({ keyType, keypath, autoincrement, values });
      };
    };
  });
}

function getKeypathAndValues(indexKeypath: string[], records: DBRecord[]) {
  if (indexKeypath.includes("value") || indexKeypath.includes("primaryKey")) {
    // just 1 column for the index key and make the keypath part of the column name
    const k = indexKeypath.length === 1 ? indexKeypath[0] : indexKeypath;
    const keyName = `key (${JSON.stringify(k)})`;
    const values = records.map(({ key, value, primaryKey }) => ({
      [keyName]: key,
      primaryKey,
      value,
    }));
    return { keypath: [keyName, "primaryKey"], values };
  }

  // separate the index key into different columns
  let values: IndexRow[];
  if (indexKeypath.length === 1) {
    values = records.map(({ key, value, primaryKey }) => ({
      [indexKeypath[0]]: key,
      primaryKey,
      value,
    }));
  } else {
    values = records.map(({ key, value, primaryKey }) => {
      // the index key is an array
      const indexKey = key as IDBValidKey[];
      const obj = Object.fromEntries(
        indexKeypath.map((col, idx) => [col, indexKey[idx]]),
      );
      return { ...obj, primaryKey, value };
    });
  }
  return { keypath: [...indexKeypath, "primaryKey"], values };
}

function getIndexColumns(keypath: string[], rows: IndexRow[]) {
  const columns: TableColumn[] = keypath.map((key) => ({
    name: key,
    isKey: true,
    isVisible: false,
    datatype: "unsupported",
  }));
  columns.push({
    name: "value",
    isKey: false,
    isVisible: false,
    datatype: "unsupported",
  });
  autodetectColumnsDatatypes(rows, columns);
  return columns;
}

function getStrings(colData: TableColumnValue[]) {
  return colData.filter((v) => isString(v));
}

export function isString(value: TableColumnValue) {
  return typeof value === "string";
}

function getTimestamps(colData: TableColumnValue[]) {
  return colData.filter((v) => isTimestamp(v));
}

function isTimestamp(value: TableColumnValue) {
  const DATE_1990 = 631152000000;
  return Number.isInteger(value) && value >= DATE_1990;
}

function getDates(colData: TableColumnValue[]) {
  return colData.filter((v) => isDate(v));
}

export function isDate(value: TableColumnValue) {
  return (
    Object.prototype.toString.call(value) === "[object Date]" &&
    !isNaN(value.getTime())
  );
}

function getNumbers(colData: TableColumnValue[]) {
  return colData.filter((v) => isNumber(v));
}

export function isNumber(value: TableColumnValue) {
  return typeof value === "number";
}

function getBooleans(colData: TableColumnValue[]) {
  return colData.filter((v) => isBoolean(v));
}

export function isBoolean(value: TableColumnValue) {
  return typeof value === "boolean";
}

function getBigInts(colData: TableColumnValue[]) {
  return colData.filter((v) => isBigint(v));
}

export function isBigint(value: TableColumnValue) {
  return typeof value === "bigint";
}

function getJSONData(colData: TableColumnValue[]) {
  return colData.filter((v) => isJSON(v));
}

export function isJSON(obj: TableColumnValue) {
  if (obj === null || typeof obj === "string" || typeof obj === "boolean")
    return true;

  if (typeof obj === "number") return Number.isFinite(obj);
  if (isArray(obj)) return obj.every(isJSON);
  if (isObject(obj)) return Object.values(obj).every(isJSON);

  return false;
}

function isArray(value: TableColumnValue) {
  return Array.isArray(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isObject(value: TableColumnValue): value is Record<string, any> {
  return value != null && Object.getPrototypeOf(value) === Object.prototype;
}

function hasHighPercentage(
  colData: TableColumnValue[],
  colDataOfType: TableColumnValue[],
  percent: number,
) {
  if (colData.length > 0)
    return (colDataOfType.length * 100) / colData.length >= percent;
  return false;
}

function canUseSavedColumns(
  columnsFromSource: TableColumn[],
  savedColumns: TableColumn[],
) {
  // can use the saved columns when they have the same names as the source
  // columns and have the same columns marked as keys
  const sourceNames = new Set(columnsFromSource.map((c) => c.name));
  const savedNames = new Set(savedColumns.map((c) => c.name));
  const sourceKeyNames = new Set(
    columnsFromSource.filter((c) => c.isKey).map((c) => c.name),
  );
  const savedKeyNames = new Set(
    savedColumns.filter((c) => c.isKey).map((c) => c.name),
  );
  return (
    sourceNames.size === savedNames.size &&
    sourceNames.isSubsetOf(savedNames) &&
    sourceKeyNames.size === savedKeyNames.size &&
    sourceKeyNames.isSubsetOf(savedKeyNames)
  );
}

/**
 * convert supported, but not json-serializable, datatypes (date, bigint)
 * to string values. Also, set the values for unsupported datatypes to
 * undefined.
 * This is to enable passing the data between the inspected window and
 * the extension without errors (only json-serializable values can be passed)
 * https://developer.chrome.com/docs/extensions/reference/api/devtools/inspectedWindow#:~:text=The%20evaluated%20code%20may%20return%20a%20value%20that%20is%20passed%20to%20the%20extension%20callback.%20The%20returned%20value%20has%20to%20be%20a%20valid%20JSON%20object%20(it%20may%20contain%20only%20primitive%20JavaScript%20types%20and%20acyclic%20references%20to%20other%20JSON%20objects).
 */
function convertStoreData(columns: TableColumn[], rows: TableRow[]) {
  const unsupportedColumns = columns.filter(
    (col) => col.datatype === "unsupported",
  );
  const dateColumns = columns.filter((col) => col.datatype === "date");
  const bigintColumns = columns.filter((col) => col.datatype === "bigint");
  if (unsupportedColumns.length || dateColumns.length || bigintColumns.length) {
    for (const row of rows) {
      for (const col of unsupportedColumns) {
        row[col.name] = undefined;
      }
      for (const col of dateColumns) {
        const val = row[col.name];
        if (isDate(val)) {
          row[col.name] = val.toISOString();
        } else {
          row[col.name] = val === null ? null : undefined;
        }
      }
      for (const col of bigintColumns) {
        const val = row[col.name];
        if (isBigint(val)) {
          row[col.name] = val.toString();
        } else {
          row[col.name] = val === null ? null : undefined;
        }
      }
    }
  }

  return rows;
}

// the below is just to avoid adding ts-ignores
declare global {
  interface Window {
    __indexeddb_browser_data?: ObjectStoreResponse;
  }
}
