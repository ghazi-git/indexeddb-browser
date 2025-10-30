import { ObjectStoreResponse } from "@/devtools/utils/inspected-window-data";
import { DATA_ERROR_MSG } from "@/devtools/utils/inspected-window-helpers";

export function checkForObjectStoreDataResponse(requestID: string) {
  const code = getDataResponseCode(requestID);
  return new Promise<ObjectStoreResponse | undefined>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      code,
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

function getDataResponseCode(requestID: string) {
  function getData(requestID: string) {
    if (
      window.__indexeddb_browser_data?.requestID === requestID &&
      window.__indexeddb_browser_data?.status === "success"
    ) {
      return window.__indexeddb_browser_data.data;
    }
  }

  return `
getData("${requestID}");

${getData.toString()}
`;
}
