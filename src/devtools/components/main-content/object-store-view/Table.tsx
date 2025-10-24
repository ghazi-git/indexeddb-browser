import {
  ColDef,
  ColumnMovedEvent,
  createGrid,
  GridApi,
} from "ag-grid-community";
import { createEffect, createSignal, onMount } from "solid-js";

import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";
import {
  isBigint,
  isDate,
  isNumber,
  isString,
  TableColumn,
  TableRow,
} from "@/devtools/utils/create-table-query";
import {
  convertDateToString,
  convertToString,
  NullishBigintRenderer,
  NullishDateRenderer,
  NullishNumberRenderer,
  NullishStringRenderer,
  RawDataRenderer,
} from "@/devtools/utils/table-cell-renderer";

import styles from "./Table.module.css";

export default function Table(props: TableProps) {
  const theme = createThemeSignal();
  let gridApi: GridApi;
  let tableContainer: HTMLDivElement;

  const { settings } = useTableSettingsContext();
  const columnDefs = (): ColDef[] => {
    return props.columns.map((column) => {
      let filterOptions: undefined | string[];
      if (column.datatype === "number") {
        filterOptions = NUMBER_FILTER_OPTIONS;
      } else if (
        column.datatype === "date" ||
        column.datatype === "timestamp"
      ) {
        filterOptions = DATE_FILTER_OPTIONS;
      }
      const bigIntComparator = (
        valueA?: bigint | null,
        valueB?: bigint | null,
      ) => {
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return -1;
        if (valueB == null) return 1;
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      };

      return {
        field: column.name,
        headerName: getHeaderName(column),
        hide: !column.isVisible,
        headerTooltip: getHeaderTooltip(column),
        cellDataType: getCellDatatype(column),
        cellRenderer: getCellRenderer(column),
        valueGetter: (params) => {
          // timestamp/date/number/bigint/string columns cast their values
          // to the corresponding type. Values that do not match that type
          // are set as undefined. Null values are left as is since they
          // usually mark the absence of a value rather than an invalid value
          const value = params.data[params.colDef.field!];
          if (column.datatype === "string") {
            return isString(value) || value === null ? value : undefined;
          } else if (column.datatype === "number") {
            return isNumber(value) || value === null ? value : undefined;
          } else if (column.datatype === "timestamp") {
            if (Number.isInteger(value) && value >= 0) {
              return new Date(value);
            } else {
              return value === null ? null : undefined;
            }
          } else if (column.datatype === "bigint") {
            return isBigint(value) || value === null ? value : undefined;
          } else if (column.datatype === "date") {
            return isDate(value) || value === null ? value : undefined;
          } else {
            // convert raw data value to string so that sort, column filter
            // and quick filter work the same as a text column
            return convertToString(value).text;
          }
        },
        filter: true,
        filterParams: {
          buttons: ["reset"],
          filterOptions,
        },
        comparator: column.datatype === "bigint" ? bigIntComparator : undefined,
      } as ColDef;
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
          valueParser: (params) => {
            if (params.newValue === "null") return null;
            if (params.newValue === "undefined") return undefined;

            return params.newValue;
          },
          valueFormatter: (params) => String(params.value),
        },
        // the custom number type allows for handling null/undefined the same
        // way as the other types
        customNumber: {
          baseDataType: "number",
          extendsDataType: "number",
          valueParser: (params) => {
            if (params.newValue === "null") return null;
            if (params.newValue === "undefined" || params.newValue === "") {
              return undefined;
            }

            const nb = Number(params.newValue);
            return isNaN(nb) ? undefined : nb;
          },
          valueFormatter: (params) => String(params.value),
        },
        dateTime: {
          baseDataType: "dateTime",
          extendsDataType: "dateTime",
          valueParser: (params) => {
            if (params.newValue === "null") return null;
            if (params.newValue === "undefined") return undefined;

            // convert from `yyyy-mm-dd hh:mm:ss.sss`
            const dtParts = params.newValue.split(" ");
            return dtParts.length === 2
              ? new Date(`${dtParts.join("T")}Z`)
              : undefined;
          },
          valueFormatter: (params) => {
            // format as yyyy-mm-dd hh:mm:ss.sss
            const value = params.value;
            return value ? convertDateToString(value) : String(value);
          },
        },
        bigint: {
          baseDataType: "object",
          extendsDataType: "object",
          valueParser: (params) => {
            const value = params.newValue;
            if (value === "null") return null;
            if (value === "undefined" || value === "") return undefined;

            const convertToBigint = (v: string) => {
              try {
                return BigInt(v);
              } catch {
                return undefined;
              }
            };

            if (value.endsWith("n")) {
              return convertToBigint(value.slice(0, value.length - 1));
            } else {
              return convertToBigint(value);
            }
          },
          valueFormatter: (params) => {
            const value = params.value as bigint | undefined | null;
            if (value === null || value === undefined) {
              return String(value);
            } else {
              return `${value}n`;
            }
          },
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

function getHeaderName(column: TableColumn) {
  return column.datatype === "timestamp" ? `${column.name} ⏱` : column.name;
}

function getHeaderTooltip(column: TableColumn) {
  return column.datatype === "timestamp"
    ? "Column values are timestamps formatted as datetime"
    : "";
}

function getCellDatatype(column: TableColumn) {
  if (column.datatype === "number") {
    return "customNumber";
  } else if (column.datatype === "bigint") {
    return "bigint";
  } else if (column.datatype === "timestamp" || column.datatype === "date") {
    return "dateTime";
  } else if (column.datatype === "string") {
    return "string";
  } else {
    return "rawData";
  }
}

function getCellRenderer(column: TableColumn) {
  if (column.datatype === "number") {
    return NullishNumberRenderer;
  } else if (column.datatype === "bigint") {
    return NullishBigintRenderer;
  } else if (column.datatype === "timestamp" || column.datatype === "date") {
    return NullishDateRenderer;
  } else if (column.datatype === "string") {
    return NullishStringRenderer;
  } else {
    return RawDataRenderer;
  }
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

const DATE_FILTER_OPTIONS = ["greaterThan", "lessThan", "blank", "notBlank"];

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
