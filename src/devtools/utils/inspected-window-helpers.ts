export function sleep(timeMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}

export const DATABASES_ERROR_MSG =
  "An unexpected error occurred. Please try fetching the databases again " +
  "by clicking the reload icon in the sidebar header.";
