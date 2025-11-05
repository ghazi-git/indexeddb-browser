import { ColDef } from "ag-grid-community";

import { isString } from "@/devtools/utils/inspected-window-data";
import { NullishStringRenderer } from "@/devtools/utils/table-cell-renderer";
import { TableColumn } from "@/devtools/utils/types";

export function getStringColdef(
  column: TableColumn,
  canEditColumn: boolean,
): ColDef {
  return {
    field: column.name,
    headerName: column.name,
    hide: !column.isVisible,
    cellDataType: "string",
    cellRenderer: NullishStringRenderer,
    editable: canEditColumn && !column.isKey,
    cellEditor: "agTextCellEditor",
    valueGetter: (params) => {
      const value = params.data[params.colDef.field!];
      return isString(value) || value === null ? value : undefined;
    },
    getQuickFilterText: (params) => formatString(params.value),
    filter: "agTextColumnFilter",
    filterParams: {
      buttons: ["reset"],
    },
  };
}

export function formatString(val: string | null | undefined) {
  return String(val);
}
