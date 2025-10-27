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

export type TableColumnDatatype =
  | "timestamp"
  | "date"
  | "number"
  | "string"
  | "bigint"
  | "boolean"
  | "raw_data";
