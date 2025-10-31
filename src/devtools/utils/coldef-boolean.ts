import { ColDef } from "ag-grid-community";

import { isBoolean } from "@/devtools/utils/inspected-window-data";
import { NullishBooleanRenderer } from "@/devtools/utils/table-cell-renderer";
import { FilterOptionDef, TableColumn } from "@/devtools/utils/types";

export function getBooleanColdef(column: TableColumn): ColDef {
  return {
    field: column.name,
    headerName: column.name,
    hide: !column.isVisible,
    cellDataType: "boolean",
    cellRenderer: NullishBooleanRenderer,
    valueGetter: (params) => {
      const value = params.data[params.colDef.field!];
      return isBoolean(value) || value === null ? value : undefined;
    },
    getQuickFilterText: (params) => formatBoolean(params.value),
    filter: true,
    filterParams: {
      buttons: ["reset"],
      filterOptions: BOOLEAN_FILTER_OPTIONS,
    },
  };
}

export function formatBoolean(val: boolean | null | undefined) {
  return String(val);
}

const BOOLEAN_FILTER_OPTIONS: FilterOptionDef[] = [
  "empty",
  {
    displayKey: "true",
    displayName: "True",
    numberOfInputs: 0,
    predicate: (_, cellValue) => cellValue === true,
  },
  {
    displayKey: "false",
    displayName: "False",
    numberOfInputs: 0,
    predicate: (_, cellValue) => cellValue === false,
  },
  {
    displayKey: "blankBoolean",
    displayName: "Blank",
    numberOfInputs: 0,
    predicate: (_, cellValue) => cellValue !== true && cellValue !== false,
  },
  {
    displayKey: "notBlankBoolean",
    displayName: "Not blank",
    numberOfInputs: 0,
    predicate: (_, cellValue) => cellValue === true || cellValue === false,
  },
];
