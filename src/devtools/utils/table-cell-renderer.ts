import type { ICellRendererComp, ICellRendererParams } from "ag-grid-community";

import styles from "@/devtools/components/main-content/object-store-view/Table.module.css";

abstract class TableCellRenderer implements ICellRendererComp {
  gui!: HTMLDivElement;

  getGui() {
    return this.gui;
  }

  destroy() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refresh(params: ICellRendererParams) {
    return true;
  }
}

export class NullishStringRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this.gui.setAttribute("dir", "auto");
    this._setValue(params);
  }

  refresh(params: ICellRendererParams) {
    this._setValue(params);
    return true;
  }

  _setValue(params: ICellRendererParams) {
    this.gui.innerText = params.valueFormatted as string;
    this.gui.className = `${styles["table-cell"]} ${params.value == null ? styles.nullish : ""}`;
  }
}

export class NullishNumberRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this._setValue(params);
  }

  refresh(params: ICellRendererParams) {
    this._setValue(params);
    return true;
  }

  _setValue(params: ICellRendererParams) {
    this.gui.innerText = params.valueFormatted as string;
    if (params.value == null) {
      this.gui.className = `${styles["table-cell"]} ${styles.nullish}`;
    } else {
      this.gui.className = `${styles["table-cell"]} ${styles.blue}`;
    }
  }
}

export class NullishBigintRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this._setValue(params);
  }

  refresh(params: ICellRendererParams) {
    this._setValue(params);
    return true;
  }

  _setValue(params: ICellRendererParams) {
    this.gui.innerText = params.valueFormatted as string;
    if (params.value == null) {
      this.gui.className = `${styles["table-cell"]} ${styles.nullish}`;
    } else {
      this.gui.className = `${styles["table-cell"]} ${styles.green}`;
    }
  }
}

export class NullishDateRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this._setValue(params);
  }

  refresh(params: ICellRendererParams) {
    this._setValue(params);
    return true;
  }

  _setValue(params: ICellRendererParams) {
    this.gui.innerText = params.valueFormatted as string;
    this.gui.className = `${styles["table-cell"]} ${params.value == null ? styles.nullish : ""}`;
  }
}

export class NullishBooleanRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this._setValue(params);
  }

  refresh(params: ICellRendererParams) {
    this._setValue(params);
    return true;
  }

  _setValue(params: ICellRendererParams) {
    const value = params.value;
    this.gui.innerText = String(value);
    if (value == null) {
      this.gui.className = `${styles["table-cell"]} ${styles.nullish}`;
    } else {
      this.gui.className = `${styles["table-cell"]} ${styles.blue}`;
    }
  }
}

export class JSONDataRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this._setValue(params);
  }

  refresh(params: ICellRendererParams) {
    this._setValue(params);
    return true;
  }

  _setValue(params: ICellRendererParams) {
    this.gui.innerText = params.valueFormatted as string;
    this.gui.className = `${styles["table-cell"]} ${params.value == null ? styles.nullish : ""}`;
  }
}

export class UnsupportedRenderer extends TableCellRenderer {
  init() {
    this.gui = document.createElement("div");
    this.gui.innerText = "undefined";
    this.gui.className = `${styles["table-cell"]} ${styles.nullish}`;
  }
}
