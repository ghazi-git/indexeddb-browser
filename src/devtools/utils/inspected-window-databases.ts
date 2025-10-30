import { IndexedDB } from "@/devtools/utils/types";

export function triggerIndexedDBsFetching(requestID: string) {
  const code = getDatabasesRequestCode(requestID);
  return new Promise<void>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (_, exceptionInfo) => {
      if (exceptionInfo) {
        console.error(
          "fetch-indexedDBs: failure to trigger fetching",
          exceptionInfo,
        );
        const msg =
          "An unexpected error occurred. Please try " +
          "fetching the databases again by clicking the reload icon in " +
          "the sidebar header.";
        reject(new Error(msg));
      } else {
        resolve();
      }
    });
  });
}

function getDatabasesRequestCode(requestID: string) {
  const serializedRequestID = JSON.stringify(requestID);
  return `
processDatabasesRequest(${serializedRequestID})

${processDatabasesRequest.toString()}
${markRequestInProgress.toString()}
${getIndexedDBs.toString()}
${getObjectStores.toString()}
${markRequestAsSuccessful.toString()}
${markRequestAsFailed.toString()}
${cleanupData.toString()}
${isRequestCanceled.toString()}
`;
}

async function processDatabasesRequest(requestID: string) {
  markRequestInProgress(requestID);
  try {
    const indexedDbs = await getIndexedDBs();
    markRequestAsSuccessful(requestID, indexedDbs);
  } catch (e) {
    console.error("fetch-indexedDBs: failure", e);
    const msg = "An unexpected error occurred while fetching the indexedDBs.";
    markRequestAsFailed(requestID, msg);
  }
}

function markRequestInProgress(requestID: string) {
  window.__indexeddb_browser_databases = {
    requestID,
    status: "in_progress",
    data: null,
    errorMsg: null,
  };
}

async function getIndexedDBs() {
  const databases = await indexedDB.databases();
  const promises = databases
    .filter((db) => db.name)
    .map((db) => getObjectStores(db.name!));
  return await Promise.all(promises);
}

function getObjectStores(dbName: string) {
  return new Promise<IndexedDB>((resolve) => {
    const dbRequest = indexedDB.open(dbName);
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      resolve({
        name: dbName,
        objectStores: Array.from(db.objectStoreNames),
      });
    };
    dbRequest.onerror = () => {
      resolve({ name: dbName, objectStores: [] });
    };
  });
}

function markRequestAsSuccessful(requestID: string, indexedDBs: IndexedDB[]) {
  if (!isRequestCanceled(requestID)) {
    window.__indexeddb_browser_databases = {
      requestID,
      status: "success",
      data: indexedDBs,
      errorMsg: null,
    };
    cleanupData(requestID);
  }
}

function markRequestAsFailed(requestID: string, reason: string) {
  if (!isRequestCanceled(requestID)) {
    window.__indexeddb_browser_databases = {
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
      delete window.__indexeddb_browser_databases;
    }
  }, 10_000);
}

function isRequestCanceled(requestID: string) {
  // request is considered canceled when the user fetches indexedDBs again
  // which changes the requestID
  return (
    !window.__indexeddb_browser_databases ||
    window.__indexeddb_browser_databases.requestID !== requestID
  );
}

// the below is just to avoid adding ts-ignores
declare global {
  interface Window {
    __indexeddb_browser_databases?:
      | {
          requestID: string;
          status: "in_progress";
          data: null;
          errorMsg: null;
        }
      | {
          requestID: string;
          status: "success";
          data: IndexedDB[];
          errorMsg: null;
        }
      | {
          requestID: string;
          status: "failure";
          data: null;
          errorMsg: string;
        };
  }
}
