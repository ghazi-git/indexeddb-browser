import { ColDef } from "ag-grid-community";

import { NullishBigintRenderer } from "@/devtools/utils/table-cell-renderer";
import { FilterOptionDef, TableColumn } from "@/devtools/utils/types";

export function getBigintColdef(column: TableColumn): ColDef {
  return {
    field: column.name,
    headerName: column.name,
    hide: !column.isVisible,
    cellDataType: "bigint",
    cellRenderer: NullishBigintRenderer,
    valueGetter: (params) => {
      const value = params.data[params.colDef.field!];
      // data from the inspected window is either a bigint string or null
      // or undefined
      if (value == null) {
        return value;
      } else {
        try {
          return BigInt(value);
        } catch {
          return undefined;
        }
      }
    },
    getQuickFilterText: (params) => formatBigint(params.value),
    filter: "agTextColumnFilter",
    filterParams: {
      buttons: ["reset"],
      filterOptions: BIGINT_FILTER_OPTIONS,
      trimInput: true,
    },
    comparator: (valueA?: bigint | null, valueB?: bigint | null) => {
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return -1;
      if (valueB == null) return 1;

      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    },
  };
}

export function formatBigint(val: bigint | null | undefined) {
  return val === null || val === undefined ? String(val) : `${val}n`;
}

const BIGINT_FILTER_OPTIONS: FilterOptionDef[] = [
  {
    displayKey: "equalsBigint",
    displayName: "Equals",
    predicate: ([filterValue], cellValue) => {
      const [cValue, fValue] = castValues(cellValue, filterValue);
      if (cValue === null || fValue === null) return false;

      return cValue === fValue;
    },
  },
  {
    displayKey: "DoesNotEqualBigint",
    displayName: "Does not equal",
    predicate: ([filterValue], cellValue) => {
      const [cValue, fValue] = castValues(cellValue, filterValue);
      if (cValue === null || fValue === null) return false;

      return cValue !== fValue;
    },
  },
  {
    displayKey: "greaterThanBigint",
    displayName: "Greater than",
    predicate: ([filterValue], cellValue) => {
      const [cValue, fValue] = castValues(cellValue, filterValue);
      if (cValue === null || fValue === null) return false;

      return cValue > fValue;
    },
  },
  {
    displayKey: "greaterThanOrEqualBigint",
    displayName: "Greater than or equal to",
    predicate: ([filterValue], cellValue) => {
      const [cValue, fValue] = castValues(cellValue, filterValue);
      if (cValue === null || fValue === null) return false;

      return cValue >= fValue;
    },
  },
  {
    displayKey: "lessThanBigint",
    displayName: "Less than",
    predicate: ([filterValue], cellValue) => {
      const [cValue, fValue] = castValues(cellValue, filterValue);
      if (cValue === null || fValue === null) return false;

      return cValue < fValue;
    },
  },
  {
    displayKey: "lessThanOrEqualBigint",
    displayName: "Less than or equal to",
    predicate: ([filterValue], cellValue) => {
      const [cValue, fValue] = castValues(cellValue, filterValue);
      if (cValue === null || fValue === null) return false;

      return cValue <= fValue;
    },
  },
  {
    displayKey: "blankBigint",
    displayName: "Blank",
    numberOfInputs: 0,
    predicate: (_, cellValue) => blank(cellValue),
  },
  {
    displayKey: "notBlankBigint",
    displayName: "Not blank",
    numberOfInputs: 0,
    predicate: (_, cellValue) => !blank(cellValue),
  },
];

function castValues(cellValue: string, filterValue: string) {
  const bigintCellValue = getBigintValue(cellValue) ?? null;
  const bigintFilterValue = getBigintValue(filterValue) ?? null;
  return [bigintCellValue, bigintFilterValue];
}

function blank(cellValue: string) {
  const cellValueBigint = getBigintValue(cellValue) ?? null;
  return cellValueBigint === null;
}

function getBigintValue(value: string): bigint | null | undefined {
  // distinguish null from undefined to be able to filter on null or undefined
  // values individually
  if (value === "null") return null;
  if (value === "undefined" || value === "") return undefined;

  const val =
    value.length >= 2 && value.endsWith("n")
      ? value.slice(0, value.length - 1)
      : value;
  return convertToBigint(val);
}

function convertToBigint(v: string) {
  try {
    return BigInt(v);
  } catch {
    return undefined;
  }
}
