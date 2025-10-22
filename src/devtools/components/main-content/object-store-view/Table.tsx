import {
  ColDef,
  ColumnMovedEvent,
  createGrid,
  GridApi,
} from "ag-grid-community";
import { createEffect, createSignal, onMount } from "solid-js";

import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";
import { TableColumn, TableRow } from "@/devtools/utils/create-table-query";
import {
  convertTimestampToString,
  convertToString,
  TableCellRenderer,
  TimestampRenderer,
} from "@/devtools/utils/table-cell-renderer";

import styles from "./Table.module.css";

export default function Table(props: TableProps) {
  const theme = createThemeSignal();
  let gridApi: GridApi;
  let tableContainer: HTMLDivElement;

  const { settings } = useTableSettingsContext();
  const columnDefs = (): ColDef[] => {
    return props.columns.map(
      (column) =>
        ({
          field: column.name,
          headerName: column.isTimestamp ? `${column.name} ⏱` : column.name,
          hide: !column.isVisible,
          headerTooltip: column.isTimestamp
            ? "Column values are timestamps formatted as a datetime"
            : "",
          cellRenderer: column.isTimestamp
            ? TimestampRenderer
            : TableCellRenderer,
          valueGetter: (params) => {
            const value = params.data[params.colDef.field!];
            if (column.isTimestamp) {
              return convertTimestampToString(value).text;
            } else {
              return convertToString(value).text;
            }
          },
          filter: "agTextColumnFilter",
          filterParams: {
            buttons: ["reset"],
            filterOptions: [
              "contains",
              "notContains",
              "equals",
              "notEqual",
              "startsWith",
              "endsWith",
              "blank",
              "notBlank",
            ],
          },
        }) as ColDef,
    );
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
