import {
  cleanupDataMutation,
  isDataMutationActive,
  markAsFailed,
  markAsSuccessful,
  markInProgress,
} from "@/devtools/utils/inspected-window-data-mutation";
import { DATA_MUTATION_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import { StoreClearRequest } from "@/devtools/utils/types";

export function triggerStoreClear(request: StoreClearRequest) {
  const code = getStoreClearCode(request);
  return new Promise<void>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (_, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("store-clear: failure to trigger", exceptionInfo);
        reject(new Error(DATA_MUTATION_ERROR_MSG));
      } else {
        resolve();
      }
    });
  });
}

function getStoreClearCode(request: StoreClearRequest) {
  const serializedRequest = JSON.stringify(request);
  return `
(function() {
  ${processStoreClearRequest.name}(${serializedRequest})

  ${processStoreClearRequest.toString()}
  ${clearStore.toString()}
  ${markInProgress.toString()}
  ${markAsSuccessful.toString()}
  ${markAsFailed.toString()}
  ${cleanupDataMutation.toString()}
  ${isDataMutationActive.toString()}
})()
`;
}

async function processStoreClearRequest(request: StoreClearRequest) {
  markInProgress("__indexeddb_browser_store_clear", request.requestID);

  try {
    await clearStore(request.dbName, request.storeName);
    markAsSuccessful("__indexeddb_browser_store_clear", request.requestID);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred while clearing the object store.";
    markAsFailed("__indexeddb_browser_store_clear", request.requestID, msg);
  }
}

function clearStore(dbName: string, storeName: string) {
  return new Promise<void>((resolve, reject) => {
    const dbRequest = indexedDB.open(dbName);
    dbRequest.onerror = () => {
      console.error("store-clear: db error", dbRequest.error);
      const genericErrorMsg = `An unexpected error occurred while clearing the object store.`;
      reject(new Error(genericErrorMsg, { cause: dbRequest.error }));
    };
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      if (!Array.from(db.objectStoreNames).includes(storeName)) {
        reject(new Error(`Object store '${storeName}' not found.`));
        db.close();
        return;
      }

      const tx = db.transaction(storeName, "readwrite");
      tx.oncomplete = () => {
        resolve();
        db.close();
      };
      tx.onabort = () => db.close();

      const objStore = tx.objectStore(storeName);
      objStore.clear();
    };
  });
}
