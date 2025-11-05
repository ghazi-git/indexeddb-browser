import {
  cleanupDataMutation,
  createIndexedDBKey,
  getFromDataValue,
  isDataMutationActive,
  markAsFailed,
  markAsSuccessful,
  markInProgress,
} from "@/devtools/utils/inspected-window-data-mutation";
import { DATA_MUTATION_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import { DataUpdateRequest, DataValue } from "@/devtools/utils/types";

export function triggerDataUpdate(request: DataUpdateRequest) {
  const code = getDataUpdateCode(request);
  return new Promise<void>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (_, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("data-update: failure to trigger", exceptionInfo);
        reject(new Error(DATA_MUTATION_ERROR_MSG));
      } else {
        resolve();
      }
    });
  });
}

function getDataUpdateCode(request: DataUpdateRequest) {
  const serializedRequest = JSON.stringify(request);
  return `
(function() {
  processDataUpdateRequest(${serializedRequest})

  ${processDataUpdateRequest.toString()}
  ${updateObjectField.toString()}
  ${createIndexedDBKey.toString()}
  ${getFromDataValue.toString()}
  ${markInProgress.toString()}
  ${markAsSuccessful.toString()}
  ${markAsFailed.toString()}
  ${cleanupDataMutation.toString()}
  ${isDataMutationActive.toString()}
})()
`;
}

async function processDataUpdateRequest(request: DataUpdateRequest) {
  markInProgress("__indexeddb_browser_data_update", request.requestID);
  const idbKey = createIndexedDBKey(request.key) as IDBValidKey;
  try {
    await updateObjectField(
      request.dbName,
      request.storeName,
      idbKey,
      request.fieldToUpdate,
      request.newValue,
    );
    markAsSuccessful("__indexeddb_browser_data_update", request.requestID);
  } catch (e) {
    console.error("data-update: failure", e);
    const msg =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred when updating the data.";
    markAsFailed("__indexeddb_browser_data_update", request.requestID, msg);
  }
}

function updateObjectField(
  dbName: string,
  storeName: string,
  idbKey: IDBValidKey,
  field: string,
  fieldValue: DataValue,
) {
  return new Promise<void>((resolve, reject) => {
    const dbRequest = indexedDB.open(dbName);
    const genericErrorMsg = `An unexpected error occurred when updating the data.`;
    dbRequest.onerror = () => {
      // generic handler for errors that bubble up
      console.error("data-update: db error", dbRequest.error);
      reject(genericErrorMsg);
    };
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const tx = db.transaction(storeName, "readwrite");
      tx.oncomplete = () => resolve();

      const objStore = tx.objectStore(storeName);
      const getRequest = objStore.get(idbKey);
      getRequest.onerror = () => {
        console.error("data-update: get error", getRequest.error);
        const msg = `Unable to get the object with the key=${idbKey} from the object store.`;
        reject(msg);
      };
      getRequest.onsuccess = () => {
        const obj = getRequest.result;
        if (!obj) {
          const msg = `Unable to find the object with the key=${idbKey} in the object store.`;
          reject(msg);
          return;
        }

        const updated = { ...obj, [field]: getFromDataValue(fieldValue) };
        objStore.put(updated);
      };
    };
  });
}
