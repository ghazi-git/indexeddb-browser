import { PrismEditor } from "prism-code-editor";
import { createEffect, on, onMount } from "solid-js";

import { createJSONEditor } from "@/devtools/utils/json-editor";

export default function Editor(props: EditorProps) {
  let editor: PrismEditor;
  let editorRef: HTMLDivElement;
  onMount(() => {
    editor = createJSONEditor(editorRef, props.value, (v) => props.setValue(v));
  });
  createEffect(() => {
    editor.textarea.placeholder = props.placeholder ?? "";
  });
  createEffect(
    on(
      () => props.value,
      (v) => editor.setOptions({ value: v }),
      { defer: true },
    ),
  );

  // adding contenteditable to work around a chrome devtools keydown listener
  // that prevents typing the letters `a` or `h` in the json editor. The problem
  // is that chromium code does not account for textareas inside a shadow root.
  // The chromium code can be found at
  // https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/extensions/ExtensionAPI.ts;drc=036d07d8c68f4b0322530fbe1f0061f2d8c84366;l=1377-1425
  return (
    <div
      class={props.class}
      contenteditable={true}
      ref={(elt) => (editorRef = elt)}
    />
  );
}

interface EditorProps {
  value: string;
  setValue: (k: string) => void;
  placeholder?: string;
  class?: string;
}
