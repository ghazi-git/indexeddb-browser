import { createStore } from "solid-js/store";

import { getStoreData } from "@/devtools/utils/dummy-data";
import { ActiveObjectStore, TableColumn } from "@/devtools/utils/types";

export function createTableDataQuery() {
  const [query, setQuery] = createStore<Query>({
    status: "idle",
    data: null,
    errorMsg: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  async function fetchTableData(params: ActiveObjectStore) {
    // todo still need to handle the actual flow of calling eval to get
    //  the databases or data and then polling to check if the response
    //  is ready. Also, will need to:
    //  track the count of objects to get and change the loading message.
    //  create requestId (to handle concurrent requests)
    //  ability to cancel a request (transaction.abort()), canceled state
    //  set a polling timeout
    //  delete data stored on the window object after use
    setQuery(({ data }) => ({
      status: "loading",
      data,
      errorMsg: null,
      isLoading: true,
      isSuccess: false,
      isError: false,
    }));
    try {
      const response = await getStoreData(params.dbName, params.storeName);
      let data: TableData;
      if (response.canDisplay) {
        const columns = getColumns(response.keypath, response.data);
        data = {
          canDisplay: true,
          keypath: response.keypath,
          columns,
          rows: response.data,
        };
      } else {
        data = {
          canDisplay: false,
          keypath: null,
          columns: null,
          rows: null,
        };
      }
      setQuery({
        status: "success",
        data,
        errorMsg: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
      });
      return data;
    } catch (e) {
      console.error("query-error", e);
      const msg = "An unexpected error occurred";
      setQuery(({ data }) => ({
        status: "error",
        data,
        errorMsg: msg,
        isLoading: false,
        isSuccess: false,
        isError: true,
      }));
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

interface QueryIdle {
  status: "idle";
  data: null;
  errorMsg: null;
  isLoading: false;
  isSuccess: false;
  isError: false;
}

interface QueryLoading {
  status: "loading";
  data: TableData | null;
  errorMsg: null;
  isLoading: true;
  isSuccess: false;
  isError: false;
}

interface QuerySuccess {
  status: "success";
  data: TableData;
  errorMsg: null;
  isLoading: false;
  isSuccess: true;
  isError: false;
}

interface QueryError {
  status: "error";
  data: TableData | null;
  errorMsg: string;
  isLoading: false;
  isSuccess: false;
  isError: true;
}

export type Query = QueryIdle | QueryLoading | QuerySuccess | QueryError;

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
