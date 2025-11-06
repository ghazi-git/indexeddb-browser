import { ICellEditorComp, ICellEditorParams } from "ag-grid-community";

import styles from "@/devtools/components/main-content/object-store-view/Table.module.css";

/**
 * Similar to agNumberCellEditor but works with BigInt
 */
export class BigintCellEditor implements ICellEditorComp {
  gui!: HTMLInputElement;

  init(params: ICellEditorParams) {
    this.gui = document.createElement("input");
    this.gui.className = styles["bigint-cell-editor"];
    this.gui.setAttribute("type", "number");
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
