import {
  cleanupDataMutation,
  isDataMutationActive,
  markAsFailed,
  markAsSuccessful,
  markInProgress,
} from "@/devtools/utils/inspected-window-data-mutation";
import { DATA_MUTATION_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import { DatabaseDeleteRequest } from "@/devtools/utils/types";

export function triggerDatabaseDelete(request: DatabaseDeleteRequest) {
  const code = getDatabaseDeleteCode(request);
  return new Promise<void>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(code, (_, exceptionInfo) => {
      if (exceptionInfo) {
        console.error("database-delete: failure to trigger", exceptionInfo);
        reject(new Error(DATA_MUTATION_ERROR_MSG));
      } else {
        resolve();
      }
    });
  });
}

function getDatabaseDeleteCode(request: DatabaseDeleteRequest) {
  const serializedRequest = JSON.stringify(request);
  return `
(function() {
  ${processDatabaseDeleteRequest.name}(${serializedRequest})

  ${processDatabaseDeleteRequest.toString()}
  ${deleteDatabase.toString()}
  ${markInProgress.toString()}
  ${markAsSuccessful.toString()}
  ${markAsFailed.toString()}
  ${cleanupDataMutation.toString()}
  ${isDataMutationActive.toString()}
})()
`;
}

async function processDatabaseDeleteRequest(request: DatabaseDeleteRequest) {
  markInProgress("__indexeddb_browser_database_delete", request.requestID);

  try {
    await deleteDatabase(request.dbName);
    markAsSuccessful("__indexeddb_browser_database_delete", request.requestID);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "An unexpected error occurred while deleting the database.";
    markAsFailed("__indexeddb_browser_database_delete", request.requestID, msg);
  }
}

function deleteDatabase(dbName: string) {
  return new Promise<void>((resolve, reject) => {
    const dbRequest = indexedDB.deleteDatabase(dbName);
    dbRequest.onsuccess = () => resolve();
    dbRequest.onerror = () => {
      console.error("database-delete: db error", dbRequest.error);
      const genericErrorMsg = `An unexpected error occurred while deleting the database.`;
      reject(new Error(genericErrorMsg, { cause: dbRequest.error }));
    };
    dbRequest.onblocked = () => {
      const genericErrorMsg =
        "Deletion request blocked. Another database connection is currently " +
        "open. Please try again in few moments or reload the page if the " +
        "deletion request keeps getting blocked.";
      reject(new Error(genericErrorMsg));
    };
  });
}
