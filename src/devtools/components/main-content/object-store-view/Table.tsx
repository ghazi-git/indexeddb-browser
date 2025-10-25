import {
  ColDef,
  ColumnMovedEvent,
  createGrid,
  GridApi,
} from "ag-grid-community";
import { createEffect, createSignal, onMount } from "solid-js";

import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";
import { formatBigint, getBigintColdef } from "@/devtools/utils/coldef-bigint";
import { getBooleanColdef } from "@/devtools/utils/coldef-boolean";
import {
  formatDate,
  getDateColdef,
  getTimestampColdef,
} from "@/devtools/utils/coldef-date-timestamp";
import { formatNumber, getNumberColdef } from "@/devtools/utils/coldef-number";
import { getRawDataColdef } from "@/devtools/utils/coldef-rawdata";
import { formatString, getStringColdef } from "@/devtools/utils/coldef-string";
import { TableColumn, TableRow } from "@/devtools/utils/create-table-query";

import styles from "./Table.module.css";

export default function Table(props: TableProps) {
  const theme = createThemeSignal();
  let gridApi: GridApi;
  let tableContainer: HTMLDivElement;

  const { settings } = useTableSettingsContext();
  const columnDefs = (): ColDef[] => {
    return props.columns.map((column) => {
      if (column.datatype === "string") {
        return getStringColdef(column);
      } else if (column.datatype === "number") {
        return getNumberColdef(column);
      } else if (column.datatype === "timestamp") {
        return getTimestampColdef(column);
      } else if (column.datatype === "date") {
        return getDateColdef(column);
      } else if (column.datatype === "bigint") {
        return getBigintColdef(column);
      } else if (column.datatype === "boolean") {
        return getBooleanColdef(column);
      } else {
        return getRawDataColdef(column);
      }
    });
  };

  const { updateColumnOrder } = useTableContext();
  onMount(() => {
    gridApi = createGrid(tableContainer, {
      rowData: props.rows,
      columnDefs: columnDefs(),
      defaultColDef: { flex: 1 },
      tooltipShowDelay: 1000,
      cacheQuickFilter: true,
      pagination: settings.pagination,
      paginationPageSizeSelector: [20, 100, 500, 1000],
      paginationPageSize: 20,
      suppressDragLeaveHidesColumns: true,
      onColumnMoved(event: ColumnMovedEvent) {
        const colName = event.column?.getColId();
        if (colName && event.finished) {
          updateColumnOrder(colName, event.toIndex!);
        }
      },
      dataTypeDefinitions: {
        // just an explicit alias for text
        rawData: {
          baseDataType: "text",
          extendsDataType: "text",
        },
        string: {
          baseDataType: "text",
          extendsDataType: "text",
          valueFormatter: (params) => formatString(params.value),
        },
        // the custom number type allows for handling null/undefined the same
        // way as the other types
        customNumber: {
          baseDataType: "number",
          extendsDataType: "number",
          valueFormatter: (params) => formatNumber(params.value),
        },
        dateTime: {
          baseDataType: "dateTime",
          extendsDataType: "dateTime",
          valueFormatter: (params) => formatDate(params.value),
        },
        bigint: {
          baseDataType: "object",
          extendsDataType: "object",
          valueFormatter: (params) => formatBigint(params.value),
        },
      },
    });
  });

  // update table settings
  createEffect(() => {
    gridApi.setGridOption("quickFilterText", settings.searchTerm);
  });
  createEffect(() => {
    gridApi.setGridOption("pagination", settings.pagination);
  });
  createEffect(() => {
    gridApi.setGridOption("columnDefs", columnDefs());
  });

  return (
    <div
      ref={(elt) => {
        tableContainer = elt;
      }}
      class={styles.table}
      data-ag-theme-mode={theme()}
    />
  );
}

function createThemeSignal() {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");
  onMount(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", ({ matches: isDark }) => {
        const systemTheme = isDark ? "dark" : "light";
        setTheme(systemTheme);
      });
  });

  return theme;
}

interface TableProps {
  columns: TableColumn[];
  rows: TableRow[];
}
