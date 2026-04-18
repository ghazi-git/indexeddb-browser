import { Schema, Validator } from "jsonschema";

import { parseJSONFromUser } from "@/devtools/utils/json-editor";
import {
  SerializedObject,
  TableColumn,
  TableColumnValue,
  TableRow,
} from "@/devtools/utils/types";

export function parseInput(input: string, errorPrefix?: string) {
  const value = input.trim();
  if (!value)
    throw new SaveObjectError(`${errorPrefix || ""}This field is required.`);

  try {
    return parseJSONFromUser(value);
  } catch (e) {
    console.error("data-create: failure to parse", e);
    const msg = e instanceof Error ? e.message : "Invalid JSON";
    throw new SaveObjectError(`${errorPrefix || ""}${msg}`, { cause: e });
  }
}

export function validateDataSchema(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  schema: Schema,
  errorPrefix?: string,
) {
  const v = new Validator();
  const result = v.validate(value, schema);
  if (!result.valid && result.errors.length) {
    const errors = result.errors.map(
      (err) =>
        `${errorPrefix ?? ""}${err.property.replace("instance", "object")} ${err.message}`,
    );
    const msg = errors.join("\n");
    throw new SaveObjectError(msg);
  }
}

export function getDataWithInLineKeysSchema(
  validateDatatypes: boolean,
  columns: TableColumn[],
) {
  if (validateDatatypes)
    return {
      type: "array",
      items: {
        type: "object",
        properties: Object.fromEntries(
          columns.map((col) => [col.name, getPropertySchema(col)]),
        ),
      },
      minItems: 1,
    };
  else return { type: "array", items: { type: "object" }, minItems: 1 };
}

export function getPropertySchema(column: TableColumn) {
  const getType = (type: string, isKey: boolean) => {
    return isKey ? [type] : [type, "null"];
  };
  if (column.datatype === "string") {
    return { type: getType("string", column.isKey) };
  } else if (column.datatype === "number") {
    return { type: getType("number", column.isKey) };
  } else if (column.datatype === "timestamp") {
    return { type: getType("integer", column.isKey), minimum: 0 };
  } else if (column.datatype === "boolean") {
    return { type: getType("boolean", column.isKey) };
  } else if (column.datatype === "date") {
    return { type: getType("string", column.isKey), format: "date-time" };
  } else if (column.datatype === "bigint") {
    return { type: ["string", "null"], pattern: "^-?\\d+$" };
  } else {
    // no validation for json-data and unsupported datatypes
    return {};
  }
}

export function serializeObjects(
  parsedObj: TableRow[],
  cols: TableColumn[],
): SerializedObject[] {
  return parsedObj.map((row) => {
    return Object.entries(row).map(([colName, colValue]) => {
      const col = cols.find((col) => col.name === colName);
      return {
        name: colName,
        value: colValue,
        // user can specify columns that the extension doesn't know about or
        // the user is adding the first objects when we have no info about
        // the datatypes
        datatype: col?.datatype ?? "unsupported",
      };
    });
  });
}

export function stringifyObjectsWithInlineKeys(
  data: TableRow[],
  columns: TableColumn[],
) {
  // sort the data keys according to columns' order
  const objects = data.map((row) => {
    const keyValuePairs = columns.map((col) => [col.name, row[col.name]]);
    return Object.fromEntries(keyValuePairs);
  });

  return stringifyData(objects);
}

export function stringifyData(value: TableColumnValue) {
  return JSON.stringify(
    value,
    // replace undefined with null
    (_, val) => (val === undefined ? null : val),
    2,
  );
}

export function getSampleValue(columns: TableColumn[]) {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const keyValuePairs = columns.map((column) => {
    let value: TableColumnValue = null;
    if (column.datatype === "string") {
      value = "string";
    } else if (column.datatype === "number") {
      value = 0;
    } else if (column.datatype === "timestamp") {
      value = now.getTime();
    } else if (column.datatype === "boolean") {
      value = true;
    } else if (column.datatype === "date") {
      value = now.toISOString();
    } else if (column.datatype === "bigint") {
      value = "1234567890";
    }
    return [column.name, value] as [string, TableColumnValue];
  });
  const obj = Object.fromEntries(keyValuePairs);
  return [obj];
}

export class SaveObjectError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "SaveObjectError";
  }
}
