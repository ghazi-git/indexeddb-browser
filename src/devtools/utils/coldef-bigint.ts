import { ColDef } from "ag-grid-community";

import { NullishBigintRenderer } from "@/devtools/utils/table-cell-renderer";
import { TableColumn } from "@/devtools/utils/types";

export function getBigintColdef(
  column: TableColumn,
  canEditColumn: boolean,
): ColDef {
  return {
    field: column.name,
    headerName: column.name,
    hide: !column.isVisible,
    cellDataType: "BigInt",
    cellRenderer: NullishBigintRenderer,
    editable: canEditColumn && !column.isKey,
    cellEditor: "agTextCellEditor",
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
    filter: "agBigIntColumnFilter",
    filterParams: { buttons: ["reset"] },
  };
}

export function formatBigint(val: bigint | null | undefined) {
  return val == null ? String(val) : `${val}n`;
}
