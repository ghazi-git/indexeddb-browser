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
    } else if (typeof originalValue === "bigint") {
      this.gui.className = `${styles["table-cell"]} ${styles.green}`;
    } else {
      this.gui.className = styles["table-cell"];
    }
  }
}

export function convertToString(val: ANY): ConvertedValue {
  if (typeof val === "string") {
    return { text: val, type: "string" };
  } else if (typeof val === "number") {
    return { text: String(val), type: "number" };
  } else if (typeof val === "boolean") {
    return { text: String(val), type: "boolean" };
  } else if (val === undefined || val === null) {
    return { text: String(val), type: "nullish" };
  } else if (Object.prototype.toString.call(val) === "[object Date]") {
    return {
      text: isNaN(val.getTime()) ? "Invalid Date" : convertDateToString(val),
      type: "date",
    };
  } else if (Array.isArray(val)) {
    return { text: convertArrayToString(val), type: "array" };
  } else if (Object.getPrototypeOf(val) === Object.prototype) {
    return { text: convertObjectToString(val), type: "object" };
  } else if (typeof val === "bigint") {
    return { text: `${val}n`, type: "bigint" };
  } else if (val instanceof Set) {
    return { text: convertSetToString(val), type: "set" };
  } else if (val instanceof Map) {
    return { text: convertMapToString(val), type: "map" };
  } else {
    return { text: String(val), type: "other" };
  }
}

export function convertDateToString(dt: Date) {
  // all dates are formatted in UTC
  return dt.toISOString().replace("T", " ").replace("Z", "");
}

function convertArrayToString(val: ANY[]) {
  // not formatting nested values for now. check for a package to
  // syntax-highlight later
  try {
    return JSON.stringify(val);
  } catch (e) {
    console.error("cell-rendering: failure to convert array to string", e);
    return String(val);
  }
}

function convertObjectToString(val: Record<ANY, ANY>) {
  // not formatting nested values for now
  try {
    return JSON.stringify(val);
  } catch (e) {
    console.error("cell-rendering: failure to convert object to string", e);
    return String(val);
  }
}

function convertSetToString(val: Set<ANY>) {
  const arrayString = convertArrayToString([...val]);
  return `{${arrayString.slice(1, arrayString.length - 1)}}`;
}

function convertMapToString(val: Map<ANY, ANY>) {
  const toString = (v: ANY) => {
    try {
      return JSON.stringify(v);
    } catch (e) {
      console.error("cell-rendering: failure to convert map to string", e);
      return String(v);
    }
  };

  const parts: string[] = [];
  for (const [k, v] of val) {
    parts.push(`${toString(k)} ⇒ ${toString(v)}`);
  }
  return `{${parts.join(", ")}}`;
}

interface ConvertedValue {
  text: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "nullish"
    | "date"
    | "array"
    | "object"
    | "bigint"
    | "set"
    | "map"
    | "other";
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type ANY = any; // to place eslint-disable in one place only
