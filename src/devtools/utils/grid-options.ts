import { GridApi, IRowNode } from "ag-grid-community";

import { SelectedObjectID } from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import {
  DataValue,
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
  const key: DataValue[] = [];
  keypath.forEach((colName) => {
    const col = columns.find((col) => col.name === colName);
    if (!col) throw new Error(`Key column '${colName}' not found`);
    if (
      col.datatype !== "string" &&
      col.datatype !== "number" &&
      col.datatype !== "timestamp" &&
      col.datatype !== "json_data" &&
      col.datatype !== "date"
    ) {
      throw new Error("Invalid key column datatype");
    }
    const value = row[colName];
    if (value == null) throw new Error("Invalid key column value");

    key.push({ value, datatype: col.datatype });
  });
  if (key.length === 0) throw new Error("Invalid key");

  return key;
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
  const tx = gridApi.applyTransaction({
    update: [{ ...oldRow, [column.name]: newValue }],
  });
  if (tx && tx.update.length) {
    gridApi.flashCells({
      rowNodes: [tx.update[0]],
      columns: [column.name],
    });
  }
}

export function convertGetterValueToRowDataValue(
  value: TableColumnValue,
  datatype: TableColumnDatatype,
) {
  // convert the value returned by the column's valueGetter to the value that
  // gets stored in rowData. The value in rowData is the value passed from
  // the inspected window to the extension i.e. JSON-compliant value (dates
  // and bigints as strings)
  // - timestamp columns: convert from date to ms since epoch
  // - date columns: convert from date to iso-formatted string
  // - bigint columns: convert from bigint to integer as a string
  // - json columns: convert from json string to json object
  if (datatype === "timestamp") {
    return value == null ? value : value.getTime();
  } else if (datatype === "date") {
    return value == null ? value : value.toISOString();
  } else if (datatype === "bigint") {
    return value == null ? value : value.toString();
  } else if (datatype === "json_data") {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  } else {
    return value;
  }
}

export function getSelectedObjectID(
  node: IRowNode,
  keypath: string[],
  columns: TableColumn[],
): SelectedObjectID {
  const objectID = JSON.parse(node.id!) as TableColumnValue[];

  return objectID.map((value, index) => {
    const colName = keypath[index];
    const column = columns.find((col) => col.name === colName);
    return {
      value,
      name: colName,
      datatype: column!.datatype,
    };
  });
}
