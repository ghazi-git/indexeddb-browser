import { ColDef } from "ag-grid-community";

import { isDate, TableColumn } from "@/devtools/utils/create-table-query";
import {
  convertDateToString,
  NullishDateRenderer,
} from "@/devtools/utils/table-cell-renderer";

export function getDateColdef(column: TableColumn): ColDef {
  return {
    field: column.name,
    headerName: column.name,
    hide: !column.isVisible,
    cellDataType: "dateTime",
    cellRenderer: NullishDateRenderer,
    valueGetter: (params) => {
      const value = params.data[params.colDef.field!];
      return isDate(value) || value === null ? value : undefined;
    },
    getQuickFilterText: (params) => formatDate(params.value),
    filter: true,
    filterParams: {
      buttons: ["reset"],
      filterOptions: DATE_FILTER_OPTIONS,
    },
  };
}

export function getTimestampColdef(column: TableColumn): ColDef {
  return {
    field: column.name,
    headerName: `${column.name} ⏱`,
    hide: !column.isVisible,
    headerTooltip: "Column values are timestamps formatted as datetime",
    cellDataType: "dateTime",
    cellRenderer: NullishDateRenderer,
    valueGetter: (params) => {
      const value = params.data[params.colDef.field!];
      if (Number.isInteger(value) && value >= 0) {
        return new Date(value);
      } else {
        return value === null ? null : undefined;
      }
    },
    getQuickFilterText: (params) => formatDate(params.value),
    filter: true,
    filterParams: {
      buttons: ["reset"],
      filterOptions: DATE_FILTER_OPTIONS,
    },
  };
}

export function formatDate(val: Date | null | undefined) {
  return val ? convertDateToString(val) : String(val);
}

const DATE_FILTER_OPTIONS = ["greaterThan", "lessThan", "blank", "notBlank"];
