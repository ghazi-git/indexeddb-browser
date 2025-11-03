import { ColDef } from "ag-grid-community";

import { isJSON } from "@/devtools/utils/inspected-window-data";
import { JSONDataRenderer } from "@/devtools/utils/table-cell-renderer";
import { TableColumn } from "@/devtools/utils/types";

export function getJSONDataColdef(column: TableColumn): ColDef {
  return {
    field: column.name,
    headerName: column.name,
    hide: !column.isVisible,
    cellDataType: "jsonData",
    cellRenderer: JSONDataRenderer,
    valueGetter: (params) => {
      const value = params.data[params.colDef.field!];
      if (value == null) {
        return value;
      } else {
        return isJSON(value) ? JSON.stringify(value) : undefined;
      }
    },
    getQuickFilterText: (params) => formatJSON(params.value),
    filter: "agTextColumnFilter",
    filterParams: {
      buttons: ["reset"],
    },
  };
}

export function formatJSON(val: string | null | undefined) {
  return String(val);
}
