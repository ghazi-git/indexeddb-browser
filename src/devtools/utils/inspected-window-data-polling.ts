import { DATA_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";
import { ObjectStoreResponse } from "@/devtools/utils/types";

export function checkForObjectStoreDataResponse() {
  return new Promise<ObjectStoreResponse | undefined>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      "window.__indexeddb_browser_data",
      (result: ObjectStoreResponse | undefined, exceptionInfo) => {
        if (exceptionInfo) {
          const log = "fetch-data: failure to poll object store data";
          console.error(log, exceptionInfo);
          let msg = DATA_ERROR_MSG;
          if (
            exceptionInfo.isError &&
            exceptionInfo.code === "E_PROTOCOLERROR"
          ) {
            msg =
              "The object store contains unsupported datatypes. Use the " +
              "native IndexedDB viewer instead.";
          }

          reject(new Error(msg));
        } else {
          resolve(result);
        }
      },
    );
  });
}
