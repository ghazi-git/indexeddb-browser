import { ColDef } from "ag-grid-community";

import { isNumber, TableColumn } from "@/devtools/utils/create-table-query";
import { NullishNumberRenderer } from "@/devtools/utils/table-cell-renderer";

export function getNumberColdef(column: TableColumn): ColDef {
  return {
    field: column.name,
    headerName: column.name,
    hide: !column.isVisible,
    cellDataType: "customNumber",
    cellRenderer: NullishNumberRenderer,
    valueGetter: (params) => {
      const value = params.data[params.colDef.field!];
      return isNumber(value) || value === null ? value : undefined;
    },
    getQuickFilterText: (params) => formatNumber(params.value),
    filter: true,
    filterParams: {
      buttons: ["reset"],
      filterOptions: NUMBER_FILTER_OPTIONS,
    },
  };
}

export function formatNumber(val: number | null | undefined) {
  return String(val);
}

const NUMBER_FILTER_OPTIONS = [
  "equals",
  "notEqual",
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
  "blank",
  "notBlank",
];
