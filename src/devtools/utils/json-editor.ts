import "prism-code-editor/prism/languages/json";

import { parse } from "@prantlf/jsonlint";
import { PrismEditor } from "prism-code-editor";
import { basicEditor } from "prism-code-editor/setups";

export function createJSONEditor(
  container: HTMLDivElement,
  initialValue: string,
  onUpdate?: (value: string, editor: PrismEditor) => void,
) {
  const systemScheme = getSystemTheme();
  // when using createEditor, for some reason, enter click inside a curly
  // braces doesn't auto-indent in the next like (behavior that can't
  // be seen in their docs site). Maybe this is also linked to some listener
  // in chrome devtools and is no longer an issue after adding contenteditable
  // to the editor container (need to test this at some point in the future)
  return basicEditor(container, {
    value: initialValue,
    language: "json",
    wordWrap: true,
    theme: systemScheme === "light" ? "night-owl-light" : "night-owl",
    onUpdate,
  });
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function parseJSONFromUser(value: string) {
  return parse(value, {
    mode: "json",
    ignoreTrailingCommas: true,
    allowSingleQuotedStrings: true,
    allowDuplicateObjectKeys: false,
  });
}
