import {
  cleanupDataMutation,
  getStoreValue,
  isDataMutationActive,
  markAsFailed,
  markAsSuccessful,
  markInProgress,
} from "@/devtools/utils/inspected-window-data-mutation";
import { DATA_MUTATION_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import { DataSaveInLineKeyRequest, TableRow } from "@/devtools/utils/types";

export function triggerDataSaveInLineKey(request: DataSaveInLineKeyRequest) {
  const code = getDataSaveInLineKeyCode(request);
  return new Promise<void>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (_, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("data-save: failure to trigger", exceptionInfo);
        reject(new Error(DATA_MUTATION_ERROR_MSG));
      } else {
        resolve();
      }
    });
  });
}

function getDataSaveInLineKeyCode(request: DataSaveInLineKeyRequest) {
  const serializedRequest = JSON.stringify(request);
  return `
(function() {
  ${processDataSaveInLineKeyRequest.name}(${serializedRequest})

  ${processDataSaveInLineKeyRequest.toString()}
  ${saveObjects.toString()}
  ${getStoreValue.toString()}
  ${markInProgress.toString()}
  ${markAsSuccessful.toString()}
  ${markAsFailed.toString()}
  ${cleanupDataMutation.toString()}
  ${isDataMutationActive.toString()}
})()
`;
}

async function processDataSaveInLineKeyRequest(
  request: DataSaveInLineKeyRequest,
) {
  markInProgress(
    "__indexeddb_browser_data_save_in_line_key",
    request.requestID,
  );

  try {
    const objects = request.objects.map((obj) => {
      const keyValuePairs = obj.map((field) => {
        return [field.name, getStoreValue(field)] as const;
      });
      return Object.fromEntries(keyValuePairs);
    });
    await saveObjects(request.dbName, request.storeName, objects);
    markAsSuccessful(
      "__indexeddb_browser_data_save_in_line_key",
      request.requestID,
    );
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred when saving the data.";
    markAsFailed(
      "__indexeddb_browser_data_save_in_line_key",
      request.requestID,
      msg,
    );
  }
}

function saveObjects(dbName: string, storeName: string, objects: TableRow[]) {
  return new Promise<void>((resolve, reject) => {
    const dbRequest = indexedDB.open(dbName);
    const genericErrorMsg = `An unexpected error occurred when saving the data.`;
    dbRequest.onerror = () => {
      console.error("data-save: db error", dbRequest.error);
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
            console.error("data-save: put error", putRequest.error);
            // better to just return the indexedDB error given that many things
            // can go wrong
            // https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put#exceptions
            const msg =
              putRequest.error?.message ??
              `Unable to save the object=${JSON.stringify(obj)}.`;
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
