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
      activeStore: ActiveObjectStore;
    }
  | {
      canDisplay: false;
      keypath: null;
      rows: null;
      columns: null;
      activeStore: ActiveObjectStore;
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

export interface DataUpdateRequest {
  requestID: string;
  dbName: string;
  storeName: string;
  key: DataValue[];
  fieldToUpdate: string;
  newValue: DataValue;
}

export interface DataDeletionRequest {
  requestID: string;
  dbName: string;
  storeName: string;
  keys: DataValue[][];
}

export interface DataCreationRequest {
  requestID: string;
  dbName: string;
  storeName: string;
  objects: SerializedObject[];
}

export type SerializedObject = {
  name: string;
  value: JSONSerializable;
  datatype: TableColumnDatatype;
}[];

// we're passing the datatype along with the value because date objects can
// only be passed as strings between the extension and the inspected window
export type DataValue =
  | { value: string | null | undefined; datatype: "string" }
  | { value: number | null | undefined; datatype: "number" }
  // timestamps are passed as their original type number (they are handled
  // as date objects in the table)
  | { value: number | null | undefined; datatype: "timestamp" }
  // dates are passed as iso-formatted strings and converted to date objects
  // in the inspected window
  | { value: string | null | undefined; datatype: "date" }
  // bigints are passed as strings and converted back to bigint in the
  // inspected window
  | { value: string | null | undefined; datatype: "bigint" }
  | { value: boolean | null | undefined; datatype: "boolean" }
  | { value: JSONSerializable | undefined; datatype: "json_data" };

type JSONSerializable =
  | string
  | number
  | boolean
  | null
  | JSONSerializable[]
  | { [key: string]: JSONSerializable };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StoreValue = any;

// add types for the window attributes used to track requests triggered by
// the extension to add/update/delete data
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window
    extends Partial<Record<MutationResponseAttr, DataMutationResponse>> {}
}

export type MutationResponseAttr =
  | "__indexeddb_browser_data_update"
  | "__indexeddb_browser_data_delete"
  | "__indexeddb_browser_data_create";

export type DataMutationResponse =
  | {
      requestID: string;
      status: "in_progress";
      errorMsg: null;
    }
  | {
      requestID: string;
      status: "success";
      errorMsg: null;
    }
  | {
      requestID: string;
      status: "failure";
      errorMsg: string;
    };
