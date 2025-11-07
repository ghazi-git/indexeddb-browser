import "prism-code-editor/prism/languages/json";

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
    theme: systemScheme === "light" ? "night-owl-light" : "night-owl",
  });
  editor.container.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      // the editor usually prevents enter click from bubbling up. However,
      // when the editor is empty or a single line with no braces, enter
      // click doesn't add a new line in the textarea and bubbles up.
      // That results in the cell editor committing the changes. So, we
      // prevent that here. Doesn't seem to be an issue in the documentation
      // site though.
      event.stopPropagation();

      // get selection start/end
      const start = editor.textarea.selectionStart;
      const end = editor.textarea.selectionEnd;
      const before = editor.textarea.value.slice(0, start);
      const after = editor.textarea.value.slice(end);

      // notice how a newline was NOT added
      editor.textarea.value = before + after;
      // now we magically have a new line added in the editor UI
      editor.textarea.selectionStart = editor.textarea.selectionEnd = start;
    }
  });
  return editor;
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
