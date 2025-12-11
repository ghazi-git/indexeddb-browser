import {
  cleanupDataMutation,
  getStoreValue,
  isDataMutationActive,
  markAsFailed,
  markAsSuccessful,
  markInProgress,
} from "@/devtools/utils/inspected-window-data-mutation";
import { DATA_MUTATION_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import { DataCreationRequest, StoreValue } from "@/devtools/utils/types";

export function triggerDataCreation(request: DataCreationRequest) {
  const code = getDataCreationCode(request);
  return new Promise<void>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (_, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("data-creation: failure to trigger", exceptionInfo);
        reject(new Error(DATA_MUTATION_ERROR_MSG));
      } else {
        resolve();
      }
    });
  });
}

function getDataCreationCode(request: DataCreationRequest) {
  const serializedRequest = JSON.stringify(request);
  return `
(function() {
  ${processDataCreationRequest.name}(${serializedRequest})

  ${processDataCreationRequest.toString()}
  ${insertObjects.toString()}
  ${getStoreValue.toString()}
  ${markInProgress.toString()}
  ${markAsSuccessful.toString()}
  ${markAsFailed.toString()}
  ${cleanupDataMutation.toString()}
  ${isDataMutationActive.toString()}
})()
`;
}

async function processDataCreationRequest(request: DataCreationRequest) {
  markInProgress("__indexeddb_browser_data_create", request.requestID);
  const objects = request.objects.map((obj) => {
    const keyValuePairs = obj.map((field) => {
      return [field.name, getStoreValue(field)] as [string, StoreValue];
    });
    return Object.fromEntries(keyValuePairs);
  });

  try {
    await insertObjects(request.dbName, request.storeName, objects);
    markAsSuccessful("__indexeddb_browser_data_create", request.requestID);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred when inserting the data.";
    markAsFailed("__indexeddb_browser_data_create", request.requestID, msg);
  }
}

function insertObjects(
  dbName: string,
  storeName: string,
  objects: Record<string, StoreValue>[],
) {
  return new Promise<void>((resolve, reject) => {
    const dbRequest = indexedDB.open(dbName);
    const genericErrorMsg = `An unexpected error occurred when inserting the data.`;
    dbRequest.onerror = () => {
      console.error("data-creation: db error", dbRequest.error);
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
      objects.forEach((obj) => {
        try {
          const putRequest = objStore.put(obj);
          putRequest.onerror = () => {
            console.error("data-creation: put error", putRequest.error);
            // better to just return the indexedDB error given that many things
            // can go wrong
            // https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put#exceptions
            const msg =
              putRequest.error?.message ??
              `Unable to insert the object=${JSON.stringify(obj)}.`;
            reject(new Error(msg));
          };
        } catch (e) {
          reject(e);
          tx.abort();
          return;
        }
      });
    };
  });
}
