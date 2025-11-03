export type FilterOptionDef =
  | string
  | {
      displayKey: string;
      displayName: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      predicate: (filterValues: any[], celValue: any) => boolean;
      numberOfInputs?: 0 | 1 | 2;
    };
export type ActiveObjectStore = {
  dbName: string;
  storeName: string;
};
export type AutosizeColumns = "fit-grid-width" | "fit-cell-contents";

export type TableData =
  | {
      canDisplay: true;
      keypath: string[];
      rows: TableRow[] | null;
      columns: TableColumn[];
    }
  | {
      canDisplay: false;
      keypath: null;
      rows: null;
      columns: null;
    };
export type TableRow = Record<string, TableColumnValue>;
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type TableColumnValue = any;

export interface TableColumn {
  name: string;
  isKey: boolean;
  isVisible: boolean;
  datatype: TableColumnDatatype;
}

export const TABLE_COLUMN_DATATYPES = [
  "timestamp",
  "date",
  "number",
  "string",
  "bigint",
  "boolean",
  "json_data",
  "unsupported",
] as const;
export type TableColumnDatatype = (typeof TABLE_COLUMN_DATATYPES)[number];

export interface IndexedDB {
  name: string;
  objectStores: string[];
}

export type IndexedDBResponse =
  | {
      requestID: string;
      status: "in_progress";
      data: null;
      errorMsg: null;
    }
  | {
      requestID: string;
      status: "success";
      data: IndexedDB[];
      errorMsg: null;
    }
  | {
      requestID: string;
      status: "failure";
      data: null;
      errorMsg: string;
    };

export type ObjectStoreResponse =
  | {
      requestID: string;
      status: "in_progress";
      data: null;
      errorMsg: null;
    }
  | {
      requestID: string;
      status: "success";
      data: TableData;
      errorMsg: null;
    }
  | {
      requestID: string;
      status: "failure";
      data: null;
      errorMsg: string;
    };

export type ObjectStoreData =
  | {
      canDisplay: true;
      keypath: string[];
      values: TableRow[];
    }
  | {
      canDisplay: false;
      keypath: null;
      values: null;
    };
