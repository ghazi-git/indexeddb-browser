import { DATA_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import { ObjectStoreData, ObjectStoreResponse } from "@/devtools/utils/types";

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
    const response = await getObjectStoreData(requestID, dbName, storeName);
    markRequestAsSuccessful(requestID, response);
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

function markRequestAsSuccessful(requestID: string, data: ObjectStoreData) {
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

// the below is just to avoid adding ts-ignores
declare global {
  interface Window {
    __indexeddb_browser_data?: ObjectStoreResponse;
  }
}
