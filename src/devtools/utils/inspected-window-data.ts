import { DATA_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import {
  ObjectStoreData,
  ObjectStoreResponse,
  TableColumn,
  TableColumnDatatype,
  TableColumnValue,
  TableData,
  TableRow,
} from "@/devtools/utils/types";

export function triggerDataFetching(
  requestID: string,
  dbName: string,
  storeName: string,
) {
  const code = getDataRequestCode(requestID, dbName, storeName);
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
) {
  const serializedRequestID = JSON.stringify(requestID);
  const serializedDBName = JSON.stringify(dbName);
  const serializedStoreName = JSON.stringify(storeName);

  return `
processDataRequest(${serializedRequestID}, ${serializedDBName}, ${serializedStoreName})

${processDataRequest.toString()}
${getObjectStoreData.toString()}
${markRequestInProgress.toString()}
${markRequestAsSuccessful.toString()}
${markRequestAsFailed.toString()}
${cleanupData.toString()}
${isRequestCanceled.toString()}
${getColumns.toString()}
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
${getMixed.toString()}
${isMixed.toString()}
${getArrays.toString()}
${isArray.toString()}
${getObjects.toString()}
${isObject.toString()}
${hasHighPercentage.toString()}
${convertStoreData.toString()}
`;
}

async function processDataRequest(
  requestID: string,
  dbName: string,
  storeName: string,
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
    const data = await getObjectStoreData(requestID, dbName, storeName);
    let resp: TableData;
    if (data.canDisplay) {
      const columns = getColumns(data.keypath, data.values);
      const keypath = data.keypath;
      const rows = convertStoreData(columns, data.values);
      resp = { canDisplay: true, keypath, columns, rows };
    } else {
      resp = { canDisplay: false, keypath: null, columns: null, rows: null };
    }
    markRequestAsSuccessful(requestID, resp);
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
) {
  let tx: IDBTransaction;
  const startTime = Date.now();
  const timerID = setInterval(() => {
    // for requests to get a lot of data, we have this interval timer that
    // aborts the transaction if it takes too long or the request was canceled
    if (
      isRequestCanceled(requestID) ||
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
        const msg =
          "An unexpected error occurred. Please try fetching the object store " +
          "data again by clicking the reload icon in the header.";
        reject(new Error(msg));
        clearInterval(timerID);
        db.close();
      };
      tx.onabort = () => {
        reject(new Error("Request timed out or canceled."));
        clearInterval(timerID);
        db.close();
      };

      const objectStore = tx.objectStore(storeName);
      if (!objectStore.keyPath) {
        resolve({ canDisplay: false, keypath: null, values: null });
        clearInterval(timerID);
        db.close();
        return;
      }
      const keypath =
        typeof objectStore.keyPath === "string"
          ? [objectStore.keyPath]
          : objectStore.keyPath;

      const getAllReq = objectStore.getAll();
      getAllReq.onerror = () => {
        const msg =
          "An unexpected error occurred. Please try fetching the object store " +
          "data again by clicking the reload icon in the header.";
        reject(new Error(msg));
        clearInterval(timerID);
        db.close();
      };
      getAllReq.onsuccess = () => {
        resolve({ canDisplay: true, keypath, values: getAllReq.result });
        clearInterval(timerID);
        db.close();
      };
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

function markRequestAsSuccessful(requestID: string, data: TableData) {
  if (!isRequestCanceled(requestID)) {
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
  if (!isRequestCanceled(requestID)) {
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
    if (!isRequestCanceled(requestID)) {
      delete window.__indexeddb_browser_data;
    }
  }, 10_000);
}

function isRequestCanceled(requestID: string) {
  // request is considered canceled when the user fetches data again
  // or for another object store, and that changes the requestID
  return (
    !window.__indexeddb_browser_data ||
    window.__indexeddb_browser_data.requestID !== requestID
  );
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
      .filter((value) => value !== null && value !== undefined);
  }
  const setDatatype = (column: TableColumn, datatype: TableColumnDatatype) => {
    column.datatype = datatype;
    column.isVisible = true;
  };
  for (const column of columns) {
    const columnData = nonNullishData[column.name];
    if (columnData.length) {
      if (hasHighPercentage(columnData, getStrings(columnData))) {
        setDatatype(column, "string");
      } else if (hasHighPercentage(columnData, getTimestamps(columnData))) {
        setDatatype(column, "timestamp");
      } else if (hasHighPercentage(columnData, getNumbers(columnData))) {
        setDatatype(column, "number");
      } else if (hasHighPercentage(columnData, getBooleans(columnData))) {
        setDatatype(column, "boolean");
      } else if (hasHighPercentage(columnData, getBigInts(columnData))) {
        setDatatype(column, "bigint");
      } else if (hasHighPercentage(columnData, getDates(columnData))) {
        setDatatype(column, "date");
      } else if (
        hasHighPercentage(columnData, getObjects(columnData)) ||
        hasHighPercentage(columnData, getArrays(columnData)) ||
        hasHighPercentage(columnData, getMixed(columnData))
      ) {
        setDatatype(column, "raw_data");
      }
    }
  }

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

function getMixed(colData: TableColumnValue[]) {
  return colData.filter((v) => isMixed(v));
}

function isMixed(value: TableColumnValue) {
  // mix of primitive datatypes that are json-serializable
  return isString(value) || isNumber(value) || isBoolean(value);
}

function getArrays(colData: TableColumnValue[]) {
  return colData.filter((v) => isArray(v));
}

function isArray(value: TableColumnValue) {
  return Array.isArray(value);
}

function getObjects(colData: TableColumnValue[]) {
  return colData.filter((v) => isObject(v));
}

function isObject(value: TableColumnValue) {
  return Object.getPrototypeOf(value) === Object.prototype;
}

function hasHighPercentage(
  colData: TableColumnValue[],
  colDataOfType: TableColumnValue[],
) {
  return colDataOfType.length / colData.length >= 0.8;
}

/**
 * convert supported, but not json-serializable, datatypes (date, bigint)
 * to string values. Also, set the values for unsupported datatypes to
 * null.
 * This is to enable passing the data between the inspected window and
 * the extension without errors (only json-serializable values can be passed)
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
        row[col.name] = null;
      }
      for (const col of dateColumns) {
        row[col.name] = row[col.name]?.toISOString() ?? null;
      }
      for (const col of bigintColumns) {
        row[col.name] = isBigint(row[col.name])
          ? row[col.name].toString()
          : null;
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
