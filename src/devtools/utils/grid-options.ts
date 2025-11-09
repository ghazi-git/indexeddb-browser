import { GridApi, IRowNode } from "ag-grid-community";

import { SelectedRowID } from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import {
  DataKey,
  TableColumn,
  TableColumnDatatype,
  TableColumnValue,
  TableRow,
} from "@/devtools/utils/types";

export function getIndexedDBKey(
  keypath: string[],
  columns: TableColumn[],
  row: TableRow,
) {
  const key: DataKey[] = [];
  keypath.forEach((colName) => {
    const col = columns.find((col) => col.name === colName);
    if (!col) throw new Error(`Key column '${colName}' not found`);
    if (
      col.datatype !== "string" &&
      col.datatype !== "number" &&
      col.datatype !== "timestamp" &&
      col.datatype !== "date"
    ) {
      throw new Error("Invalid key column datatype");
    }
    const value = row[colName];
    if (value == null) throw new Error("Invalid key column value");

    key.push(convertToDataValue(value, col.datatype));
  });
  if (key.length === 0) throw new Error("Invalid key");

  return key;
}

export function convertToDataValue<T extends TableColumnDatatype>(
  value: TableColumnValue,
  datatype: Exclude<T, "unsupported">,
) {
  if (datatype === "timestamp") {
    // convert timestamp back to being a number which is the original
    // type of data stored in indexedDB
    return { value: value == null ? value : value.getTime(), datatype };
  } else if (datatype === "date") {
    // serialize date object as a string to be passed safely to the inspected
    // window and converted back to date object there
    return { value: value == null ? value : value.toISOString(), datatype };
  } else if (datatype === "bigint") {
    return { value: value == null ? value : value.toString(), datatype };
  } else if (datatype === "json_data") {
    try {
      const val = JSON.parse(value);
      return { value: val, datatype };
    } catch {
      return { value: undefined, datatype };
    }
  } else {
    return { value, datatype };
  }
}

export function parseBooleanNull(
  newValue: TableColumnValue,
  datatype: TableColumnDatatype,
) {
  if (datatype === "boolean") {
    // for booleans, valueParser is not called because the cell editor is a select
    // https://github.com/ag-grid/ag-grid/issues/8073#issuecomment-2449543951
    // so we handle converting the null string to a js null here. note that
    // setting a js null as a select value results in an empty select option
    // (no text)
    return newValue === "null" ? null : newValue;
  }
  return newValue;
}

export function updateRowData(
  gridApi: GridApi,
  oldRow: TableRow,
  column: TableColumn,
  newValue: TableColumnValue,
) {
  // convert the newValue according to what's expected in rowData for
  // each datatype:
  // - timestamp => ms since epoch
  // - date => iso-formatted string
  // - bigint => integer as string
  // - json string => json object
  let value = newValue;
  if (column.datatype === "timestamp") {
    value = value == null ? value : value.getTime();
  } else if (column.datatype === "date") {
    value = value == null ? value : value.toISOString();
  } else if (column.datatype === "bigint") {
    value = value == null ? value : value.toString();
  } else if (column.datatype === "json_data") {
    try {
      value = JSON.parse(value);
    } catch {
      value = undefined;
    }
  }

  const tx = gridApi.applyTransaction({
    update: [{ ...oldRow, [column.name]: value }],
  });
  if (tx && tx.update.length) {
    gridApi.flashCells({
      rowNodes: [tx.update[0]],
      columns: [column.name],
    });
  }
}

export function getSelectedRowID(
  node: IRowNode,
  keypath: string[],
  columns: TableColumn[],
): SelectedRowID {
  const rowID = JSON.parse(node.id!) as TableColumnValue[];

  return rowID.map((value, index) => {
    const colName = keypath[index];
    const column = columns.find((col) => col.name === colName);
    return {
      value,
      name: colName,
      datatype: column!.datatype,
    };
  });
}
