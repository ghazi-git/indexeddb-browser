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
  "raw_data",
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
