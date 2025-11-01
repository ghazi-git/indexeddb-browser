import { DATA_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import { TableColumn, TableRow } from "@/devtools/utils/types";

export function checkForObjectStoreDataStatus() {
  return new Promise<ObjectStoreStatus>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      `
      (function() {
        const data = window.__indexeddb_browser_data;
        return {requestID: data?.requestID, status: data?.status, errorMsg: data?.errorMsg};
      })()
      `,
      (result: ObjectStoreStatus, exceptionInfo) => {
        if (exceptionInfo) {
          const log = "fetch-data: failure to poll object store data status";
          console.error(log, exceptionInfo);
          reject(new Error(DATA_ERROR_MSG));
        } else {
          resolve(result);
        }
      },
    );
  });
}

export function getObjectStoreMetadata() {
  return new Promise<ObjectStoreMetadata>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      `
      (function() {
        const {canDisplay, keypath, columns} = window.__indexeddb_browser_data.data;
        return {canDisplay, keypath, columns};
      })()
      `,
      (result: ObjectStoreMetadata, exceptionInfo) => {
        if (exceptionInfo) {
          const log = "fetch-data: failure to get object store metadata";
          console.error(log, exceptionInfo);
          reject(new Error(DATA_ERROR_MSG));
        } else {
          resolve(result);
        }
      },
    );
  });
}

export function getObjectStoreData() {
  return new Promise<TableRow[] | null>((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      "window.__indexeddb_browser_data.data.rows",
      (result: TableRow[], exceptionInfo) => {
        if (exceptionInfo) {
          const log = "fetch-data: failure to get object store data";
          console.error(log, exceptionInfo);
          resolve(null);
        } else {
          resolve(result);
        }
      },
    );
  });
}

type ObjectStoreMetadata =
  | {
      canDisplay: true;
      keypath: string[];
      columns: TableColumn[];
    }
  | {
      canDisplay: false;
      keypath: null;
      columns: null;
    };

type ObjectStoreStatus =
  | {
      requestID: undefined;
      status: undefined;
      errorMsg: undefined;
    }
  | {
      requestID: string;
      status: "in_progress";
      errorMsg: null;
    }
  | {
      requestID: string;
      status: "success";
      errorMsg: null;
    }
  | {
      requestID: string;
      status: "failure";
      errorMsg: string;
    };
