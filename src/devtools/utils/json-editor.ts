import "prism-code-editor/prism/languages/json";

import { parse } from "@prantlf/jsonlint";
import { basicEditor } from "prism-code-editor/setups";

export function createJSONEditor(
  container: HTMLDivElement,
  initialValue: string,
) {
  const systemScheme = getSystemTheme();
  // when using createEditor, for some reason, enter click inside a curly
  // braces doesn't auto-indent in the next like (behavior that can't
  // be seen in their docs site)
  const editor = basicEditor(container, {
    value: initialValue,
    language: "json",
    wordWrap: true,
    theme: systemScheme === "light" ? "night-owl-light" : "night-owl",
  });
  editor.container.addEventListener("keydown", (event) => {
    if (event.key === "a" || event.key === "A") {
      // letting the event bubble results in the character not being written
      // to the textarea.
      // Seems like "Chrome's own devtools frontend" has a keydown listener
      // that calls `event.preventDefault()`. Removing the listener from
      // "Elements panel > Event Listeners" results in the character being
      // written as expected. Usually, the listener ignores textarea and inputs
      // when they are the current `document.activeElement`. But, it doesn't
      // in this case, because the editor uses shadow dom to render, making
      // the `document.activeElement` equal to the div acting as the editor
      // container rather than the inner textarea.
      event.stopImmediatePropagation();
    }
  });
  return editor;
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
