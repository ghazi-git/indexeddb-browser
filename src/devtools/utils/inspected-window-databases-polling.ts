import { IndexedDBInfo } from "./inspected-window-databases";

export async function fetchIndexedDBs(requestID: string) {
  let timeSinceStart = 0;
  let iteration = 0;
  while (timeSinceStart < 3_000) {
    const sleepTime = 5 * Math.pow(2, iteration);
    await sleep(Math.min(sleepTime, 500));
    const data = await checkForDatabasesResponse(requestID);
    if (data) return data;

    iteration++;
    timeSinceStart += sleepTime;
  }
  const msg =
    "Fetching IndexedDBs timed out. You can try again by clicking " +
    "the refresh icon in the sidebar header.";
  throw new Error(msg);
}

function checkForDatabasesResponse(requestID: string) {
  const code = getDatabasesResponseCode(requestID);
  return new Promise<IndexedDBInfo[] | undefined>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      code,
      (result: IndexedDBInfo[] | undefined, exceptionInfo) => {
        if (exceptionInfo) {
          console.error(
            "fetch-indexedDBs: failure to poll indexedDBs",
            exceptionInfo,
          );
          const msg =
            "An unexpected error occurred. Please try " +
            "fetching the databases again by clicking the refresh icon in " +
            "the sidebar header.";
          reject(new Error(msg));
        } else {
          resolve(result);
        }
      },
    );
  });
}

function getDatabasesResponseCode(requestID: string) {
  function getData(requestID: string) {
    if (
      window.__indexeddb_browser_databases?.requestID === requestID &&
      window.__indexeddb_browser_databases?.status === "success"
    ) {
      return window.__indexeddb_browser_databases.data;
    }
  }

  return `
getData("${requestID}");
${getData.toString()}
`;
}

function sleep(timeMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}
