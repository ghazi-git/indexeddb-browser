import { DATA_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import {
  InspectedWindowTableData,
  ObjectStoreData,
  ObjectStoreResponse,
  OutOfLineRecord,
  TableColumn,
  TableColumnDatatype,
  TableColumnValue,
  TableRow,
} from "@/devtools/utils/types";

export function triggerDataFetching(
  requestID: string,
  dbName: string,
  storeName: string,
  savedColumns: TableColumn[] | undefined,
  objectsCount: number | undefined,
) {
  const code = getDataRequestCode(
    requestID,
    dbName,
    storeName,
    savedColumns,
    objectsCount,
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
  dbName: string,
  storeName: string,
  savedColumns: TableColumn[] | undefined,
  objectsCount: number | undefined,
) {
  const serializedRequestID = JSON.stringify(requestID);
  const serializedDBName = JSON.stringify(dbName);
  const serializedStoreName = JSON.stringify(storeName);
  const serializedColumns = JSON.stringify(savedColumns);
  const serializedCount = JSON.stringify(objectsCount);

  return `
(function() {
  ${processDataRequest.name}(${serializedRequestID}, ${serializedDBName}, ${serializedStoreName}, ${serializedColumns}, ${serializedCount})

  ${processDataRequest.toString()}
  ${getObjectStoreData.toString()}
  ${markRequestInProgress.toString()}
  ${markRequestAsSuccessful.toString()}
  ${markRequestAsFailed.toString()}
  ${cleanupData.toString()}
  ${isRequestActive.toString()}
  ${getColumns.toString()}
  ${determineColumnDatatype.toString()}
  ${getOutOfLineStoreColumns.toString()}
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
  dbName: string,
  storeName: string,
  savedColumns: TableColumn[] | undefined,
  objectsCount: number | undefined,
) {
  markRequestInProgress(requestID);
  // make sure the database exists to avoid creating a new one when opening
  // a connection
  try {
    const databases = await indexedDB.databases();
    const db = databases.find((db) => db.name === dbName);
    if (!db) {
      const msg = `The database "${dbName}" was not found.`;
      markRequestAsFailed(requestID, msg);
      return;
    }
  } catch (e) {
    console.error("fetch-data: failure", e);
    const msg =
      "An unexpected error occurred. Please try fetching the object store " +
      "data again by clicking the reload icon in the header.";
    markRequestAsFailed(requestID, msg);
    return;
  }

  try {
    const { keyType, keypath, autoincrement, values } =
      await getObjectStoreData(requestID, dbName, storeName, objectsCount);
    let columns =
      keyType === "inLine"
        ? getColumns(keypath, values)
        : getOutOfLineStoreColumns(values);
    if (savedColumns && canUseSavedColumns(columns, savedColumns)) {
      columns = savedColumns;
    }
    const rows = convertStoreData(columns, values);
    markRequestAsSuccessful(requestID, {
      keyType,
      keypath,
      autoincrement,
      columns,
      rows,
      activeStore: { dbName, storeName },
    });
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

function getObjectStoreData(
  requestID: string,
  dbName: string,
  storeName: string,
  objectsCount: number | undefined,
) {
  let tx: IDBTransaction;
  const startTime = Date.now();
  const timerID = setInterval(() => {
    // for requests to get a lot of data, we have this interval timer that
    // aborts the transaction if it takes too long or the request was canceled
    if (
      !isRequestActive(requestID) ||
      Date.now() - startTime > 30_000 + 3_000
    ) {
      tx?.abort();
    }
  }, 1000);

  return new Promise<ObjectStoreData>((resolve, reject) => {
    const dbRequest = indexedDB.open(dbName);
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const msg = `The object store "${storeName}" was not found.`;
        reject(new Error(msg));
        clearInterval(timerID);
        db.close();
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
        clearInterval(timerID);
        db.close();
      };
      tx.oncomplete = () => {
        clearInterval(timerID);
        db.close();
      };

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
            // remove the primaryKey prop in IDBRecord
            // https://w3c.github.io/IndexedDB/#record-interface
            values: (getAllReq.result as OutOfLineRecord[]).map(
              ({ key, value }) => ({ key, value }),
            ),
          });
        };
      }
    };
  });
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
  // determine column names based on the first 10 rows
  const first10Rows = rows.slice(0, 10);
  const uniqueColumns = new Set(first10Rows.flatMap(Object.keys));

  // order columns: keys first according to the keypath ordering,
  // then the rest alphabetically
  const keyColumns: TableColumn[] = keypath.map((key) => ({
    name: key,
    isKey: true,
    isVisible: false,
    datatype: "unsupported",
  }));
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  const otherColumns: TableColumn[] = [...uniqueColumns]
    .filter((col) => !keypath.includes(col))
    .toSorted(collator.compare)
    .map((name) => ({
      name,
      isKey: false,
      isVisible: false,
      datatype: "unsupported",
    }));
  const columns = keyColumns.concat(otherColumns);

  // Auto-detect columns datatypes based on non-null data in the first 100
  // rows. At least 80%, of the column data should match the datatype.
  // Users will be able to manually set the column datatype from the UI
  // in case auto-detection doesn't work as expected
  const first100Rows = rows.slice(0, 100);
  const columnNames = columns.map(({ name }) => name);
  const nonNullishData: Record<string, TableColumnValue[]> = {};
  for (const name of columnNames) {
    nonNullishData[name] = first100Rows
      .map((row) => row[name])
      .filter((value) => value != null);
  }
  for (const column of columns) {
    const columnData = nonNullishData[column.name];
    const datatype = determineColumnDatatype(columnData, 80);
    column.datatype = datatype;
    column.isVisible = datatype !== "unsupported";
  }

  return columns;
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

function getOutOfLineStoreColumns(records: OutOfLineRecord[]): TableColumn[] {
  if (records.length === 0) return [];

  // Auto-detect columns datatypes based on the first 100 records:
  // - key column: all values should match the datatype.
  // - value column: At least 80%, of the column data should match the datatype.
  const first100 = records.slice(0, 100);

  const keys = first100.map(({ key }) => key);
  const keyDatatype = determineColumnDatatype(keys, 100);

  const values = first100
    .map(({ value }) => value)
    .filter((value) => value != null);
  const valueDatatype = determineColumnDatatype(values, 80);

  return [
    {
      name: "key",
      isKey: true,
      isVisible: keyDatatype !== "unsupported",
      datatype: keyDatatype,
    },
    {
      name: "value",
      isKey: false,
      isVisible: valueDatatype !== "unsupported",
      datatype: valueDatatype,
    },
  ];
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

function isObject(value: TableColumnValue) {
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
