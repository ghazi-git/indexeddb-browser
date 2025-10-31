import type { ICellRendererComp, ICellRendererParams } from "ag-grid-community";

import styles from "@/devtools/components/main-content/object-store-view/Table.module.css";

abstract class TableCellRenderer implements ICellRendererComp {
  gui!: HTMLDivElement;

  getGui() {
    return this.gui;
  }

  destroy() {}

  refresh() {
    return true;
  }
}

export class NullishStringRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this.gui.innerText = params.valueFormatted as string;
    const value = params.value;
    if (value === null || value === undefined) {
      this.gui.className = `${styles["table-cell"]} ${styles.nullish}`;
    } else {
      this.gui.setAttribute("dir", "auto");
      this.gui.className = styles["table-cell"];
    }
  }
}

export class NullishNumberRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this.gui.innerText = params.valueFormatted as string;
    const value = params.value;
    if (value === null || value === undefined) {
      this.gui.className = `${styles["table-cell"]} ${styles.nullish}`;
    } else {
      this.gui.className = `${styles["table-cell"]} ${styles.blue}`;
    }
  }
}

export class NullishBigintRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this.gui.innerText = params.valueFormatted as string;
    const value = params.value;
    if (value === null || value === undefined) {
      this.gui.className = `${styles["table-cell"]} ${styles.nullish}`;
    } else {
      this.gui.className = `${styles["table-cell"]} ${styles.green}`;
    }
  }
}

export class NullishDateRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this.gui.innerText = params.valueFormatted as string;
    const value = params.value;
    if (value === null || value === undefined) {
      this.gui.className = `${styles["table-cell"]} ${styles.nullish}`;
    } else {
      this.gui.className = styles["table-cell"];
    }
  }
}

export class NullishBooleanRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    const value = params.value;
    this.gui.innerText = String(value);
    if (value === null || value === undefined) {
      this.gui.className = `${styles["table-cell"]} ${styles.nullish}`;
    } else {
      this.gui.className = `${styles["table-cell"]} ${styles.blue}`;
    }
  }
}

export class RawDataRenderer extends TableCellRenderer {
  init(params: ICellRendererParams) {
    this.gui = document.createElement("div");
    this.gui.innerText = params.value;
    const originalValue = params.data[params.colDef!.field!];
    if (originalValue === null || originalValue === undefined) {
      this.gui.className = `${styles["table-cell"]} ${styles.nullish}`;
    } else if (
      typeof originalValue === "number" ||
      typeof originalValue === "boolean"
    ) {
      this.gui.className = `${styles["table-cell"]} ${styles.blue}`;
    } else {
      this.gui.className = styles["table-cell"];
    }
  }
}
