import {
  cleanupDataMutation,
  createIndexedDBKey,
  getStoreValue,
  isDataMutationActive,
  markAsFailed,
  markAsSuccessful,
  markInProgress,
} from "@/devtools/utils/inspected-window-data-mutation";
import { DATA_MUTATION_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import { DataDeletionRequest } from "@/devtools/utils/types";

export function triggerDataDeletion(request: DataDeletionRequest) {
  const code = getDataDeletionCode(request);
  return new Promise<void>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (_, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("data-deletion: failure to trigger", exceptionInfo);
        reject(new Error(DATA_MUTATION_ERROR_MSG));
      } else {
        resolve();
      }
    });
  });
}

function getDataDeletionCode(request: DataDeletionRequest) {
  const serializedRequest = JSON.stringify(request);
  return `
(function() {
  processDataDeletionRequest(${serializedRequest})

  ${processDataDeletionRequest.toString()}
  ${deleteObjects.toString()}
  ${createIndexedDBKey.toString()}
  ${getStoreValue.toString()}
  ${markInProgress.toString()}
  ${markAsSuccessful.toString()}
  ${markAsFailed.toString()}
  ${cleanupDataMutation.toString()}
  ${isDataMutationActive.toString()}
})()
`;
}

async function processDataDeletionRequest(request: DataDeletionRequest) {
  markInProgress("__indexeddb_browser_data_delete", request.requestID);
  const idbKeys = request.keys.map((item) => {
    return createIndexedDBKey(item) as IDBValidKey;
  });

  try {
    await deleteObjects(request.dbName, request.storeName, idbKeys);
    markAsSuccessful("__indexeddb_browser_data_delete", request.requestID);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred when deleting the data.";
    markAsFailed("__indexeddb_browser_data_delete", request.requestID, msg);
  }
}

function deleteObjects(
  dbName: string,
  storeName: string,
  idbKeys: IDBValidKey[],
) {
  return new Promise<void>((resolve, reject) => {
    const dbRequest = indexedDB.open(dbName);
    const genericErrorMsg = `An unexpected error occurred when deleting the data.`;
    dbRequest.onerror = () => {
      console.error("data-deletion: db error", dbRequest.error);
      reject(new Error(genericErrorMsg));
    };
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const tx = db.transaction(storeName, "readwrite");
      tx.oncomplete = () => {
        resolve();
        db.close();
      };
      tx.onabort = () => db.close();

      const objStore = tx.objectStore(storeName);
      idbKeys.forEach((idbKey) => {
        const deleteRequest = objStore.delete(idbKey);
        deleteRequest.onerror = () => {
          console.error("data-deletion: delete error", deleteRequest.error);
          const msg = `Unable to delete the object with the key=${idbKey} from the object store.`;
          reject(new Error(msg));
        };
      });
    };
  });
}
