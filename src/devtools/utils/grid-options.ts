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
    value = value == null ? value : value.toISOString();
    return { value: value == null ? value : value.toISOString(), datatype };
  } else if (datatype === "bigint") {
    return { value: value == null ? value : value.toString(), datatype };
  } else {
    return { value, datatype };
  }
}
