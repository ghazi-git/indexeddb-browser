import { createStore } from "solid-js/store";

import { ActiveObjectStore } from "@/devtools/components/active-object-store-context";
import { getStoreData } from "@/devtools/utils/dummy-data";

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
      const response = await getStoreData(
        params.dbName,
        params.dbVersion,
        params.storeName,
      );
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

  return { query, fetchTableData };
}

function getColumns(keypath: string[], rows: TableRow[]) {
  // determine column names based on the first 10 rows
  const first10Rows = rows.slice(0, 10);
  const uniqueColumns = new Set(...first10Rows.flatMap(Object.keys));

  // order columns: keys first according to the keypath ordering,
  // then the rest alphabetically
  const keyColumns: TableColumn[] = keypath.map((key) => ({
    name: key,
    isKey: true,
    isVisible: true,
    isTimestamp: false,
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
      isTimestamp: false,
    }));
  const columns = keyColumns.concat(otherColumns);

  // Auto-detect timestamp columns based on non-null data in the first 100
  // rows. At least 90%, of the column data should be a timestamp.
  // A timestamp is an integer value that is greater than the timestamp
  // for 1990. Users will be able to manually set a column as timestamp
  // from the UI in case auto-detection doesn't work
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
      const timestamps = columnData.filter((v) => isTimestamp(v));
      const percentage = (timestamps.length / columnData.length) * 100;
      if (percentage >= 90) {
        column.isTimestamp = true;
      }
    }
  }

  return columns;
}

const DATE_1990 = new Date("1990-01-01").getTime();
function isTimestamp(value: TableColumnValue) {
  return Number.isInteger(value) && value >= DATE_1990;
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
export interface TableColumn {
  name: string;
  isKey: boolean;
  isVisible: boolean;
  // timestamp fields are formatted as dates
  isTimestamp: boolean;
}
