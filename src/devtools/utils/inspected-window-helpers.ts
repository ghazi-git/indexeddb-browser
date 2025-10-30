export function sleep(timeMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}

export const DATABASES_ERROR_MSG =
  "An unexpected error occurred. Please try fetching the databases again " +
  "by clicking the reload icon in the sidebar header.";

export const DATA_ERROR_MSG =
  "An unexpected error occurred. Please try fetching the object store data " +
  "again by clicking the reload icon in the header.";

export const DATA_FETCH_TIMEOUT_IN_MS = 30_000;
