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
  TableColumn,
  TableData,
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
    origin,
    requestID,
    dbName,
    storeName,
  }: QueryParams) {
    markQueryAsLoading();
    let savedColumns: TableColumn[] | undefined;
    if (origin) {
      const cols = getColumnsConfig(origin, dbName, storeName);
      if (cols.length) {
        savedColumns = cols;
      }
    }
    try {
      // trigger the request and then check for the response
      await triggerDataFetching(requestID, dbName, storeName, savedColumns);
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

      if (origin && savedColumns) {
        // if savedColumns were passed with the request, then update what's
        // in local storage in case there are updates to the object store
        const cols = responseData.columns ?? [];
        saveColumnsConfig(origin, dbName, storeName, cols);
      }
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
