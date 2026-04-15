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
import { ColumnUpdateRequest, DataValue } from "@/devtools/utils/types";

export function triggerColumnUpdate(request: ColumnUpdateRequest) {
  const code = getColumnUpdateCode(request);
  return new Promise<void>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (_, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("column-update: failure to trigger", exceptionInfo);
        reject(new Error(DATA_MUTATION_ERROR_MSG));
      } else {
        resolve();
      }
    });
  });
}

function getColumnUpdateCode(request: ColumnUpdateRequest) {
  const serializedRequest = JSON.stringify(request);
  return `
(function() {
  ${processColumnUpdateRequest.name}(${serializedRequest})

  ${processColumnUpdateRequest.toString()}
  ${updateColumnData.toString()}
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

async function processColumnUpdateRequest(request: ColumnUpdateRequest) {
  markInProgress("__indexeddb_browser_column_update", request.requestID);
  try {
    const idbKey = createIndexedDBKey(request.key) as IDBValidKey;
    await updateColumnData(
      request.dbName,
      request.storeName,
      idbKey,
      request.columnToUpdate,
      request.newValue,
    );
    markAsSuccessful("__indexeddb_browser_column_update", request.requestID);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred when updating the column data.";
    markAsFailed("__indexeddb_browser_column_update", request.requestID, msg);
  }
}

function updateColumnData(
  dbName: string,
  storeName: string,
  idbKey: IDBValidKey,
  column: string,
  columnValue: DataValue,
) {
  return new Promise<void>((resolve, reject) => {
    const dbRequest = indexedDB.open(dbName);
    const genericErrorMsg = `An unexpected error occurred when updating the column data.`;
    dbRequest.onerror = () => {
      // generic handler for errors that bubble up
      console.error("column-update: db error", dbRequest.error);
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
      const getRequest = objStore.get(idbKey);
      getRequest.onerror = () => {
        console.error("column-update: get error", getRequest.error);
        const msg = `Unable to get the object with the key=${idbKey} from the object store.`;
        reject(new Error(msg));
      };
      getRequest.onsuccess = () => {
        const obj = getRequest.result;
        if (!obj) {
          const msg = `Unable to find the object with the key=${idbKey} in the object store.`;
          reject(new Error(msg));
          return;
        }

        const updated = { ...obj, [column]: getStoreValue(columnValue) };
        objStore.put(updated);
      };
    };
  });
}
