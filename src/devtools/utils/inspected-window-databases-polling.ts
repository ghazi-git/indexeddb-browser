import {
  DATABASES_ERROR_MSG,
  sleep,
} from "@/devtools/utils/inspected-window-helpers";
import { IndexedDBResponse } from "@/devtools/utils/types";

export async function fetchIndexedDBs(requestID: string) {
  let timeSinceStart = 0;
  let iteration = 0;
  while (timeSinceStart < 3_000) {
    const sleepTime = Math.min(5 * Math.pow(2, iteration), 500);
    await sleep(sleepTime);
    const response = await checkForDatabasesResponse();
    if (!response || response.requestID !== requestID)
      throw new Error(DATABASES_ERROR_MSG);

    if (response.status === "success") {
      return response.data;
    } else if (response.status === "failure") {
      throw new Error(response.errorMsg);
    } else {
      iteration++;
      timeSinceStart += sleepTime;
    }
  }
  const msg =
    "Fetching IndexedDBs timed out. You can try again by clicking " +
    "the reload icon in the sidebar header.";
  throw new Error(msg);
}

function checkForDatabasesResponse() {
  return new Promise<IndexedDBResponse | undefined>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      "window.__indexeddb_browser_databases",
      (result: IndexedDBResponse | undefined, exceptionInfo) => {
        if (exceptionInfo) {
          console.error(
            "fetch-indexedDBs: failure to poll indexedDBs",
            exceptionInfo,
          );
          reject(new Error(DATABASES_ERROR_MSG));
        } else {
          resolve(result);
        }
      },
    );
  });
}
