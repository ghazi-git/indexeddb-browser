import { createStore } from "solid-js/store";

import { triggerDataFetching } from "@/devtools/utils/inspected-window-data";
import { checkForObjectStoreDataResponse } from "@/devtools/utils/inspected-window-data-polling";
import {
  DATA_ERROR_MSG,
  DATA_FETCH_TIMEOUT_IN_MS,
  sleep,
} from "@/devtools/utils/inspected-window-helpers";
import { ActiveObjectStore, TableData } from "@/devtools/utils/types";

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

  async function fetchTableData({ requestID, dbName, storeName }: QueryParams) {
    markQueryAsLoading();
    // todo figure out how to allow override the auto-detected types
    // if (origin) {
    //   const savedColumns = getColumnsConfig(origin, dbName, storeName);
    //   if (canUseSavedColumns(columns, savedColumns)) {
    //     columns = savedColumns;
    //   } else {
    //     // savedColumns are out of date, remove them from storage
    //     saveColumnsConfig(origin, dbName, storeName, []);
    //   }
    // }
    try {
      // trigger the request and then check for the response
      await triggerDataFetching(requestID, dbName, storeName);
      let timeSinceStart = 0;
      let iteration = 0;
      let responseData: TableData | undefined;
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

      markQueryAsSuccessful(responseData);
      return responseData;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "An unexpected error occurred";
      markQueryAsFailed(msg);
      throw new Error(msg);
    }
  }

  return { query, setQuery, fetchTableData };
}

// function canUseSavedColumns(
//   columnsFromSource: TableColumn[],
//   savedColumns: TableColumn[],
// ) {
//   // can use the saved columns when they have the same names as the source
//   // columns and have the same columns marked as keys
//   const sourceNames = new Set(columnsFromSource.map((c) => c.name));
//   const savedNames = new Set(savedColumns.map((c) => c.name));
//   const sourceKeyNames = new Set(
//     columnsFromSource.filter((c) => c.isKey).map((c) => c.name),
//   );
//   const savedKeyNames = new Set(
//     savedColumns.filter((c) => c.isKey).map((c) => c.name),
//   );
//   return (
//     sourceNames.size === savedNames.size &&
//     sourceNames.isSubsetOf(savedNames) &&
//     sourceKeyNames.size === savedKeyNames.size &&
//     sourceKeyNames.isSubsetOf(savedKeyNames)
//   );
// }

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
