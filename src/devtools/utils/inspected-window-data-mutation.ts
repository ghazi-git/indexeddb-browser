import {
  DATA_MUTATION_ERROR_MSG,
  sleep,
} from "@/devtools/utils/inspected-window-helpers";
import {
  DataKey,
  DataMutationResponse,
  DataValue,
  MutationResponseAttr,
} from "@/devtools/utils/types";

export async function isDataMutationSuccessful(
  attr: MutationResponseAttr,
  requestID: string,
) {
  let timeSinceStart = 0;
  let iteration = 0;
  while (timeSinceStart < 3_000) {
    const sleepTime = Math.min(5 * Math.pow(2, iteration), 500);
    await sleep(sleepTime);
    const response = await checkForDataMutationResponse(attr);
    if (!response || response.requestID !== requestID)
      throw new Error(DATA_MUTATION_ERROR_MSG);

    if (response.status === "success") {
      return;
    } else if (response.status === "failure") {
      throw new Error(response.errorMsg);
    } else {
      iteration++;
      timeSinceStart += sleepTime;
    }
  }
  throw new Error("Request to the object store timed out.");
}

function checkForDataMutationResponse(attr: MutationResponseAttr) {
  return new Promise<DataMutationResponse | undefined>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      `window.${attr}`,
      (result: DataMutationResponse | undefined, exceptionInfo) => {
        if (exceptionInfo) {
          console.error(
            "data-mutation: failure to poll data mutation response",
            exceptionInfo,
          );
          reject(new Error(DATA_MUTATION_ERROR_MSG));
        } else {
          resolve(result);
        }
      },
    );
  });
}

export function markInProgress(attr: MutationResponseAttr, requestID: string) {
  window[attr] = {
    requestID,
    status: "in_progress",
    errorMsg: null,
  };
}

export function markAsSuccessful(
  attr: MutationResponseAttr,
  requestID: string,
) {
  if (isDataMutationActive(attr, requestID)) {
    window[attr] = {
      requestID,
      status: "success",
      errorMsg: null,
    };
    cleanupDataMutation(attr, requestID);
  }
}

export function markAsFailed(
  attr: MutationResponseAttr,
  requestID: string,
  reason: string,
) {
  if (isDataMutationActive(attr, requestID)) {
    window[attr] = {
      requestID,
      status: "failure",
      errorMsg: reason,
    };
    cleanupDataMutation(attr, requestID);
  }
}

export function cleanupDataMutation(
  attr: MutationResponseAttr,
  requestID: string,
) {
  setTimeout(() => {
    if (isDataMutationActive(attr, requestID)) {
      delete window[attr];
    }
  }, 3_000);
}

export function isDataMutationActive(
  attr: MutationResponseAttr,
  requestID: string,
) {
  return window[attr]?.requestID === requestID;
}

export function createIndexedDBKey(key: DataKey[]) {
  if (key.length === 1) {
    return getFromDataValue(key[0]);
  } else {
    return key.map((k) => getFromDataValue(k));
  }
}

export function getFromDataValue(k: DataValue) {
  if (k.datatype === "date") {
    // dates are passed as ISO-formatted strings to the inspected window
    return typeof k.value === "string" ? new Date(k.value) : k.value;
  } else if (k.datatype === "bigint") {
    // bigints are passed as strings to the inspected window
    return typeof k.value === "string" ? BigInt(k.value) : k.value;
  }
  return k.value;
}
