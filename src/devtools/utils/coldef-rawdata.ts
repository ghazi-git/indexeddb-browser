import { ColDef } from "ag-grid-community";

import { isArray, isObject } from "@/devtools/utils/inspected-window-data";
import { RawDataRenderer } from "@/devtools/utils/table-cell-renderer";
import { TableColumn, TableColumnValue } from "@/devtools/utils/types";

export function getRawDataColdef(column: TableColumn): ColDef {
  return {
    field: column.name,
    headerName: column.name,
    hide: !column.isVisible,
    cellDataType: "rawData",
    cellRenderer: RawDataRenderer,
    valueGetter: (params) => {
      const value = params.data[params.colDef.field!];
      return convertToString(value);
    },
    getQuickFilterText: (params) => params.value,
    filter: true,
    filterParams: {
      buttons: ["reset"],
    },
  };
}

function convertToString(val: TableColumnValue) {
  if (val == null) return String(val);
  if (isObject(val) || isArray(val)) {
    try {
      return JSON.stringify(val);
    } catch (e) {
      console.error("convert-to-string: failure to convert array to string", e);
    }
  }
  return String(val);
}
