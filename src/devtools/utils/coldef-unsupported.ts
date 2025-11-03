import { ColDef } from "ag-grid-community";

import { UnsupportedRenderer } from "@/devtools/utils/table-cell-renderer";
import { TableColumn } from "@/devtools/utils/types";

export function getUnsupportedColdef(column: TableColumn): ColDef {
  return {
    field: column.name,
    headerName: column.name,
    hide: !column.isVisible,
    cellDataType: "text",
    cellRenderer: UnsupportedRenderer,
    valueGetter: () => undefined,
    getQuickFilterText: () => "undefined",
    filter: false,
  };
}
