import { GridApi, ICellEditorComp, ICellEditorParams } from "ag-grid-community";
import { PrismEditor } from "prism-code-editor";
import { createUniqueId } from "solid-js";

import btnStyles from "@/devtools/components/buttons/UnstyledButton.module.css";
import styles from "@/devtools/components/main-content/object-store-view/Table.module.css";
import { isDate, isJSON } from "@/devtools/utils/inspected-window-data";
import {
  createJSONEditor,
  parseJSONFromUser,
} from "@/devtools/utils/json-editor";

/**
 * Similar to agNumberCellEditor but works with BigInt
 */
export class BigintCellEditor implements ICellEditorComp {
  gui!: HTMLInputElement;

  init(params: ICellEditorParams) {
    this.gui = document.createElement("input");
    this.gui.className = styles["input-cell-editor"];
    this.gui.setAttribute("type", "number");
    this.gui.setAttribute("aria-label", "BigInt Editor");
    this.gui.setAttribute("id", createUniqueId());
    this.gui.setAttribute("value", params.value);
    this.gui.addEventListener("wheel", this._preventWheelFromChangingValue);
  }

  afterGuiAttached() {
    this.gui.focus();
    this.gui.select();
  }

  getGui() {
    return this.gui;
  }

  getValue() {
    const value = this.gui.value;
    if (value === "") return null;

    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }

  destroy() {
    this.gui.removeEventListener("wheel", this._preventWheelFromChangingValue);
  }

  _preventWheelFromChangingValue(event: WheelEvent) {
    event.preventDefault();
  }
}

export class JSONEditor implements ICellEditorComp {
  gui!: HTMLDivElement;
  errorMsgElement!: HTMLDivElement;
  errorContainer!: HTMLDivElement;
  editor!: PrismEditor;

  init(params: ICellEditorParams) {
    this.gui = document.createElement("div");
    this.gui.className = styles["json-editor"];

    const editorContainer = document.createElement("div");
    const editorFooter = document.createElement("div");
    editorFooter.className = styles.footer;
    this.errorContainer = this._createErrorsContainer();
    const buttonsContainer = this._createButtonsContainer(params.api);
    editorFooter.append(this.errorContainer, buttonsContainer);

    this.gui.append(editorContainer, editorFooter);

    const textareaValue = this._prettyPrint(params.value);
    this.editor = createJSONEditor(editorContainer, textareaValue);
    // editor is inside a shadow root so can't be affected by outside styles
    // so styles are set in js
    this.editor.container.style.minBlockSize = "100px";
    this.editor.container.style.maxBlockSize = "calc(100vb - 120px)";
    this.editor.container.style.minInlineSize = "200px";
    this.editor.container.style.maxInlineSize = "600px";
    const containerChild = this.editor.container.firstChild as HTMLElement;
    containerChild.style.marginBlockEnd = "0";
    this.editor.textarea.style.cursor = "text";
  }

  afterGuiAttached() {
    this.editor.textarea.focus();
  }

  getGui() {
    return this.gui;
  }

  getValue() {
    const value = this.editor.textarea.value.trim();
    if (value === "") return null;

    try {
      const parsed = parseJSONFromUser(value);
      if (parsed && isJSON(parsed)) return JSON.stringify(parsed);
    } catch {}
    return null;
  }

  isPopup() {
    return true;
  }

  _createErrorsContainer() {
    const errors = document.createElement("div");
    errors.className = `${styles.errors} ${styles.hidden}`;
    const closeBtn = this._createButton("✕");
    closeBtn.addEventListener("click", () => {
      this._hideError();
    });
    this.errorMsgElement = document.createElement("div");
    this.errorMsgElement.className = styles["error-msg"];
    errors.append(this.errorMsgElement, closeBtn);
    return errors;
  }

  _createButtonsContainer(gridApi: GridApi) {
    const btnContainer = document.createElement("div");
    btnContainer.className = styles["btn-container"];

    const cancelBtn = this._createButton("Cancel");
    cancelBtn.addEventListener("click", () => {
      gridApi.stopEditing(true);
    });

    const saveBtn = this._createButton("Save");
    saveBtn.classList.add(styles.save);
    saveBtn.addEventListener("click", () => {
      const value = this.editor.textarea.value.trim();
      if (value === "") {
        // will be considered as null
        gridApi.stopEditing();
        return;
      }

      try {
        const parsed = parseJSONFromUser(value);
        if (parsed && !isJSON(parsed)) {
          this._showError("Value must be an object or an array.");
        } else {
          gridApi.stopEditing();
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid JSON.";
        this._showError(msg, true);
      }
    });

    btnContainer.append(cancelBtn, saveBtn);
    return btnContainer;
  }

  _createButton(text: string) {
    const button = document.createElement("button");
    button.className = btnStyles.unstyled;
    button.setAttribute("type", "button");
    button.innerText = text;
    return button;
  }

  _showError(msg: string, scrollLongLine = false) {
    this.errorMsgElement.innerText = msg;
    // the error message may contain an arrow pointer to the error placement,
    // thus the use of a mono font, overflow-inline and flex-shrink=0 for
    // the error message (we don't want the line with the arrow pointer wrapping
    // to a new line when there isn't enough space). example below:
    // Parse error on line 1, column 14:
    // {"creative": ?}
    // -------------^
    this.errorMsgElement.style.flexShrink = scrollLongLine ? "0" : "1";
    this.errorContainer.classList.remove(styles.hidden);
  }

  _hideError() {
    this.errorMsgElement.innerText = "";
    this.errorContainer.classList.add(styles.hidden);
  }

  _prettyPrint(value: string | null | undefined) {
    if (value == null) return "";

    try {
      const json = JSON.parse(value);
      return JSON.stringify(json, null, 2);
    } catch {
      return "";
    }
  }
}

/**
 * Text input that accepts timestamps or datetime-formatted strings
 * (yyyy-mm-dd HH:MM:SS.f or yyyy-mm-ddTHH:MM:SS.fZ)
 */
export class DateCellEditor implements ICellEditorComp {
  gui!: HTMLInputElement;
  initialValue: Date | null | undefined;

  init(params: ICellEditorParams) {
    this.initialValue = params.value;
    this.gui = document.createElement("input");
    this.gui.className = styles["input-cell-editor"];
    this.gui.setAttribute("type", "text");
    this.gui.setAttribute("placeholder", "YYYY-MM-DD HH:MM:SS");
    this.gui.setAttribute("aria-label", "Date Editor");
    this.gui.setAttribute("id", createUniqueId());
    const value =
      this.initialValue == null ? "" : convertDateToString(this.initialValue);
    this.gui.setAttribute("value", value);
  }

  afterGuiAttached() {
    this.gui.focus();
    this.gui.select();
  }

  getGui() {
    return this.gui;
  }

  getValue() {
    const value = this.gui.value.trim();
    if (value === "") return null;

    // accept ms since epoch or iso-formatted strings or space-separated
    // date and time components
    const timestampRegex = /^\d+$/;
    if (timestampRegex.test(value)) {
      const dt = new Date(parseInt(value));
      return this._getDate(dt);
    }

    // 2025-01-01T00:00:00.000Z with the ms part optional
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
    if (isoRegex.test(value)) {
      const dt = new Date(value);
      return this._getDate(dt);
    }

    // 2025-01-01 00:00:00.000 with the ms part optional
    const spaceSeparatedRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/;
    if (spaceSeparatedRegex.test(value)) {
      // datetimes entered are considered in utc
      const dt = new Date(`${value.replace(" ", "T")}Z`);
      return this._getDate(dt);
    }

    return null;
  }

  _getDate(dt: Date) {
    if (isDate(dt)) {
      // return the initial value when the datetime does not change. This
      // lets ag-grid know that the date didn't change (values are compared
      // by reference since the date is an object)
      return this.initialValue && this.initialValue.getTime() === dt.getTime()
        ? this.initialValue
        : dt;
    }
    return null;
  }
}

export function convertDateToString(dt: Date) {
  // all dates are formatted in UTC
  return dt.toISOString().replace("T", " ").replace("Z", "");
}
