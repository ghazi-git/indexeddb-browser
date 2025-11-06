import { ICellEditorComp, ICellEditorParams } from "ag-grid-community";
import { createUniqueId } from "solid-js";

import styles from "@/devtools/components/main-content/object-store-view/Table.module.css";
import { isDate } from "@/devtools/utils/inspected-window-data";

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
