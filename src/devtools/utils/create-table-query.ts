import { createStore } from "solid-js/store";

import { triggerDataFetching } from "@/devtools/utils/inspected-window-data";
import { checkForObjectStoreDataResponse } from "@/devtools/utils/inspected-window-data-polling";
import {
  DATA_ERROR_MSG,
  DATA_FETCH_TIMEOUT_IN_MS,
  sleep,
} from "@/devtools/utils/inspected-window-helpers";
import {
  getColumnsConfig,
  saveColumnsConfig,
} from "@/devtools/utils/saved-settings";
import {
  ActiveObjectStore,
  ObjectStoreData,
  TableColumn,
} from "@/devtools/utils/types";

export function createTableDataQuery() {
  const [query, setQuery] = createStore<Query>({
    status: "idle",
    data: null,
    errorMsg: null,
    isLoading: false,
    loadingMsg: null,
    isSuccess: false,
    isError: false,
  });
  const markQueryAsLoading = () => {
    setQuery(({ data }) => ({
      status: "loading",
      data,
      errorMsg: null,
      isLoading: true,
      loadingMsg: "Loading object store data ...",
      isSuccess: false,
      isError: false,
    }));
  };
  const markQueryAsSuccessful = (data: TableData) => {
    setQuery({
      status: "success",
      data,
      errorMsg: null,
      isLoading: false,
      loadingMsg: null,
      isSuccess: true,
      isError: false,
    });
  };
  const markQueryAsFailed = (msg: string) => {
    setQuery(({ data }) => ({
      status: "error",
      data,
      errorMsg: msg,
      isLoading: false,
      loadingMsg: null,
      isSuccess: false,
      isError: true,
    }));
  };
  const setLoadingMsg = (timeSinceStart: number) => {
    if (timeSinceStart > 20_000) {
      setQuery(
        "loadingMsg",
        "This is taking longer than usual. Thank you for waiting.",
      );
    } else if (timeSinceStart > 10_000) {
      setQuery(
        "loadingMsg",
        "Looks like there is a lot of data to fetch, thank you for your patience.",
      );
    } else if (timeSinceStart > 3_000) {
      setQuery("loadingMsg", "Still working on it ...");
    }
  };

  async function fetchTableData({
    requestID,
    origin,
    dbName,
    storeName,
  }: QueryParams) {
    markQueryAsLoading();
    try {
      // trigger the request and then check for the response
      await triggerDataFetching(requestID, dbName, storeName);
      let timeSinceStart = 0;
      let iteration = 0;
      let responseData: ObjectStoreData | undefined;
      while (timeSinceStart < DATA_FETCH_TIMEOUT_IN_MS) {
        const sleepTime = Math.min(5 * Math.pow(2, iteration), 1000);
        await sleep(sleepTime);
        const response = await checkForObjectStoreDataResponse();
        if (response?.requestID === requestID) {
          if (response.status === "success") {
            responseData = response.data;
            break;
          } else if (response.status === "failure") {
            throw new Error(response.errorMsg);
          } else {
            iteration++;
            timeSinceStart += sleepTime;
            setLoadingMsg(timeSinceStart);
          }
        } else {
          throw new Error(DATA_ERROR_MSG);
        }
      }
      if (!responseData) throw new Error("Request timed out.");

      // response received
      let data: TableData;
      if (responseData.canDisplay) {
        let columns = getColumns(responseData.keypath, responseData.values);
        // load saved columns config
        if (origin) {
          const savedColumns = getColumnsConfig(origin, dbName, storeName);
          if (canUseSavedColumns(columns, savedColumns)) {
            columns = savedColumns;
          } else {
            // savedColumns are out of date, remove them from storage
            saveColumnsConfig(origin, dbName, storeName, []);
          }
        }
        const keypath = responseData.keypath;
        const rows = responseData.values;
        data = { canDisplay: true, keypath, columns, rows };
      } else {
        data = { canDisplay: false, keypath: null, columns: null, rows: null };
      }
      markQueryAsSuccessful(data);
      return data;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "An unexpected error occurred";
      markQueryAsFailed(msg);
      throw new Error(msg);
    }
  }

  return { query, setQuery, fetchTableData };
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
    isVisible: true,
    datatype: "raw_data",
  }));
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  keypath.forEach((key) => {
    uniqueColumns.delete(key);
  });
  const otherColumns: TableColumn[] = [...uniqueColumns]
    .toSorted(collator.compare)
    .map((name) => ({
      name,
      isKey: false,
      isVisible: true,
      datatype: "raw_data",
    }));
  const columns = keyColumns.concat(otherColumns);

  // Auto-detect columns datatypes based on non-null data in the first 100
  // rows. At least 90%, of the column data should match the datatype.
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
  for (const column of columns) {
    const columnData = nonNullishData[column.name];
    if (columnData.length) {
      if (hasHighPercentage(columnData, getStrings(columnData))) {
        column.datatype = "string";
      } else if (hasHighPercentage(columnData, getTimestamps(columnData))) {
        column.datatype = "timestamp";
      } else if (hasHighPercentage(columnData, getNumbers(columnData))) {
        column.datatype = "number";
      } else if (hasHighPercentage(columnData, getBooleans(columnData))) {
        column.datatype = "boolean";
      } else if (hasHighPercentage(columnData, getBigInts(columnData))) {
        column.datatype = "bigint";
      } else if (hasHighPercentage(columnData, getDates(columnData))) {
        column.datatype = "date";
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

const DATE_1990 = new Date("1990-01-01").getTime();
export function isTimestamp(value: TableColumnValue) {
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

function hasHighPercentage(
  colData: TableColumnValue[],
  colDataOfType: TableColumnValue[],
) {
  return colDataOfType.length / colData.length >= 0.9;
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

interface QueryIdle {
  status: "idle";
  data: null;
  errorMsg: null;
  isLoading: false;
  loadingMsg: null;
  isSuccess: false;
  isError: false;
}

interface QueryLoading {
  status: "loading";
  data: TableData | null;
  errorMsg: null;
  isLoading: true;
  loadingMsg: string;
  isSuccess: false;
  isError: false;
}

interface QuerySuccess {
  status: "success";
  data: TableData;
  errorMsg: null;
  isLoading: false;
  loadingMsg: null;
  isSuccess: true;
  isError: false;
}

interface QueryError {
  status: "error";
  data: TableData | null;
  errorMsg: string;
  isLoading: false;
  isSuccess: false;
  loadingMsg: null;
  isError: true;
}

export type Query = QueryIdle | QueryLoading | QuerySuccess | QueryError;

interface QueryParams extends ActiveObjectStore {
  origin: string | null;
  requestID: string;
}

export type TableData =
  | {
      canDisplay: true;
      keypath: string[];
      rows: TableRow[];
      columns: TableColumn[];
    }
  | {
      canDisplay: false;
      keypath: null;
      rows: null;
      columns: null;
    };
export type TableRow = Record<string, TableColumnValue>;
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type TableColumnValue = any;
