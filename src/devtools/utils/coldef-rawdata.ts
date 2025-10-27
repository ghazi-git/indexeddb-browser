import { ColDef } from "ag-grid-community";

import {
  convertToString,
  RawDataRenderer,
} from "@/devtools/utils/table-cell-renderer";
import { TableColumn } from "@/devtools/utils/types";

export function getRawDataColdef(column: TableColumn): ColDef {
  return {
    field: column.name,
    headerName: column.name,
    hide: !column.isVisible,
    cellDataType: "rawData",
    cellRenderer: RawDataRenderer,
    valueGetter: (params) => {
      const value = params.data[params.colDef.field!];
      return convertToString(value).text;
    },
    getQuickFilterText: (params) => params.value,
    filter: true,
    filterParams: {
      buttons: ["reset"],
    },
  };
}
