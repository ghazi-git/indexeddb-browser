import {
  cleanupDataMutation,
  getStoreValue,
  isDataMutationActive,
  markAsFailed,
  markAsSuccessful,
  markInProgress,
} from "@/devtools/utils/inspected-window-data-mutation";
import { DATA_MUTATION_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import {
  DataSaveOutOfLineKeyRequest,
  TableColumnValue,
} from "@/devtools/utils/types";

export function triggerDataSaveOutOfLineKey(
  request: DataSaveOutOfLineKeyRequest,
) {
  const code = getDataSaveOutOfLineKeyCode(request);
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

function getDataSaveOutOfLineKeyCode(request: DataSaveOutOfLineKeyRequest) {
  const serializedRequest = JSON.stringify(request);
  return `
(function() {
  ${processDataSaveOutOfLineKeyRequest.name}(${serializedRequest})

  ${processDataSaveOutOfLineKeyRequest.toString()}
  ${saveObject.toString()}
  ${getStoreValue.toString()}
  ${markInProgress.toString()}
  ${markAsSuccessful.toString()}
  ${markAsFailed.toString()}
  ${cleanupDataMutation.toString()}
  ${isDataMutationActive.toString()}
})()
`;
}

async function processDataSaveOutOfLineKeyRequest(
  request: DataSaveOutOfLineKeyRequest,
) {
  markInProgress(
    "__indexeddb_browser_data_save_out_of_line_key",
    request.requestID,
  );

  try {
    const storeKey = getStoreValue(request.key);
    let storeValue: TableColumnValue;
    if (Array.isArray(request.value)) {
      const keyValuePairs = request.value.map((field) => {
        return [field.name, getStoreValue(field)] as const;
      });
      storeValue = Object.fromEntries(keyValuePairs);
    } else {
      storeValue = getStoreValue(request.value);
    }
    await saveObject(request.dbName, request.storeName, storeKey, storeValue);
    markAsSuccessful(
      "__indexeddb_browser_data_save_out_of_line_key",
      request.requestID,
    );
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred when saving the data.";
    markAsFailed(
      "__indexeddb_browser_data_save_out_of_line_key",
      request.requestID,
      msg,
    );
  }
}

function saveObject(
  dbName: string,
  storeName: string,
  key: TableColumnValue,
  value: TableColumnValue,
) {
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
      try {
        const putRequest = objStore.put(value, key);
        putRequest.onerror = () => {
          console.error("data-save: put error", putRequest.error);
          const msg = putRequest.error?.message ?? `Unable to save the object.`;
          reject(new Error(msg));
        };
      } catch (e) {
        reject(e);
        tx.abort();
      }
    };
  });
}
