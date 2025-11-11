import {
  CellDoubleClickedEvent,
  CellEditRequestEvent,
  CellKeyDownEvent,
  ColDef,
  ColumnMovedEvent,
  createGrid,
  GridApi,
  SelectionChangedEvent,
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
} from "ag-grid-community";
import { createEffect, onCleanup, onMount, untrack } from "solid-js";
import { unwrap } from "solid-js/store";

import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { useTableMutationContext } from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";
import { formatBigint, getBigintColdef } from "@/devtools/utils/coldef-bigint";
import { getBooleanColdef } from "@/devtools/utils/coldef-boolean";
import {
  formatDate,
  getDateColdef,
  getTimestampColdef,
} from "@/devtools/utils/coldef-date-timestamp";
import {
  formatJSON,
  getJSONDataColdef,
} from "@/devtools/utils/coldef-json-data";
import { formatNumber, getNumberColdef } from "@/devtools/utils/coldef-number";
import { formatString, getStringColdef } from "@/devtools/utils/coldef-string";
import { getUnsupportedColdef } from "@/devtools/utils/coldef-unsupported";
import {
  convertToDataValue,
  getIndexedDBKey,
  getSelectedObjectID,
  parseBooleanNull,
  updateRowData,
} from "@/devtools/utils/grid-options";
import {
  DATA_MUTATION_ERROR_MSG,
  generateRequestID,
} from "@/devtools/utils/inspected-window-helpers";
import {
  ActiveObjectStore,
  DataKey,
  TableColumn,
  TableRow,
} from "@/devtools/utils/types";
import { useTheme } from "@/devtools/utils/ui-theme-context";

import styles from "./Table.module.css";

export default function Table(props: TableProps) {
  const { theme } = useTheme();
  let gridApi: GridApi;
  let tableContainer: HTMLDivElement;

  const {
    setErrorMsg,
    setSelectedObjectIDs,
    updateOperation,
    updateField,
    deleteOperation,
    resetDeleteOperation,
    tableMutationStore,
  } = useTableMutationContext();
  const { settings } = useTableSettingsContext();

  const columnDefs = (): ColDef[] => {
    const canEdit = !updateOperation.isLoading;
    return props.columns.map((column) => {
      if (column.datatype === "string") {
        return getStringColdef(column, canEdit);
      } else if (column.datatype === "number") {
        return getNumberColdef(column, canEdit);
      } else if (column.datatype === "timestamp") {
        return getTimestampColdef(column, canEdit);
      } else if (column.datatype === "date") {
        return getDateColdef(column, canEdit);
      } else if (column.datatype === "bigint") {
        return getBigintColdef(column, canEdit);
      } else if (column.datatype === "boolean") {
        return getBooleanColdef(column, canEdit);
      } else if (column.datatype === "json_data") {
        return getJSONDataColdef(column, canEdit);
      } else {
        return getUnsupportedColdef(column);
      }
    });
  };
  const autosizeStrategy = ():
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToContentStrategy => {
    if (settings.autosizeColumns === "fit-cell-contents") {
      return {
        type: "fitCellContents",
        defaultMinWidth: 50,
        defaultMaxWidth: 1000,
      };
    } else {
      return {
        type: "fitGridWidth",
        defaultMinWidth: 100,
        defaultMaxWidth: 500,
      };
    }
  };

  const { updateColumnOrder, refetch } = useTableContext();
  onMount(() => {
    let uneditableTimer: number;
    let cellWithLock: Element | undefined;
    const showCellUneditableIcon = (cell: Element | null) => {
      if (cell) {
        if (uneditableTimer) {
          clearTimeout(uneditableTimer);
          cellWithLock?.classList.remove(styles.uneditable);
        }
        // show a lock icon to signal to the user that the column is
        // uneditable
        cell.classList.add(styles.uneditable);
        cellWithLock = cell;
        uneditableTimer = setTimeout(() => {
          cell.classList.remove(styles.uneditable);
          cellWithLock = undefined;
        }, 1000);
      }
    };
    gridApi = createGrid(tableContainer, {
      rowSelection: {
        mode: "multiRow",
        checkboxes: false,
        headerCheckbox: false,
        enableClickSelection: true,
      },
      // unwrap data so it's possible to update row data in the table.
      // Updating indexedDB contents is handled in onCellEditRequest
      rowData: unwrap(props.rows),
      getRowId: (params) => {
        const key = props.keypath.map((colName) => params.data[colName]);
        return JSON.stringify(key);
      },
      columnDefs: columnDefs(),
      autoSizeStrategy: autosizeStrategy(),
      tooltipShowDelay: 1000,
      valueCache: true,
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
      onCellDoubleClicked(params: CellDoubleClickedEvent) {
        if (!params.colDef.editable) {
          const clickedCell = params.event?.target as HTMLElement;
          showCellUneditableIcon(clickedCell);
        }
      },
      onCellKeyDown(params: CellKeyDownEvent) {
        const event = params.event as unknown as KeyboardEvent;
        if (!params.colDef.editable && event.key === "Enter") {
          const gridCell = event.target as HTMLElement;
          const tableCell = gridCell.querySelector(`.${styles["table-cell"]}`);
          showCellUneditableIcon(tableCell);
        }
      },
      onSelectionChanged(params: SelectionChangedEvent) {
        const nodes = params.selectedNodes || [];
        const selectedObjectIDs = nodes.map((node) => {
          return getSelectedObjectID(node, props.keypath, props.columns);
        });
        setSelectedObjectIDs(selectedObjectIDs);
      },
      readOnlyEdit: true,
      onCellEditRequest: async (params: CellEditRequestEvent) => {
        let key: DataKey[] = [];
        try {
          key = getIndexedDBKey(props.keypath, props.columns, params.data);
        } catch (e) {
          console.error("data-update: failure to determine object key", e);
          setErrorMsg(`
            Cell update reverted: unable to determine the object key. This
            might be due to key columns datatypes. The valid key datatypes
            are string, number, date and timestamp. Also, ensure the key
            columns datatypes match those in indexedDB (timestamp is
            automatically converted to number by the extension).
          `);
          return;
        }

        const fieldToUpdate = params.colDef.field!;
        const col = props.columns.find((col) => col.name === fieldToUpdate);
        if (!col || col.datatype === "unsupported") {
          setErrorMsg(`Cell update reverted: ${DATA_MUTATION_ERROR_MSG}`);
          return;
        }
        const newValue = parseBooleanNull(params.newValue, col.datatype);

        try {
          await updateField({
            requestID: generateRequestID(),
            dbName: props.activeStore.dbName,
            storeName: props.activeStore.storeName,
            key,
            fieldToUpdate,
            newValue: convertToDataValue(newValue, col.datatype),
          });
          // after the update succeeded in indexedDB, update the table data
          updateRowData(params.api, params.data, col, newValue);
        } catch (e) {
          const msg = e instanceof Error ? e.message : DATA_MUTATION_ERROR_MSG;
          setErrorMsg(`Cell update reverted: ${msg}`);
        }
      },
      dataTypeDefinitions: {
        jsonData: {
          baseDataType: "text",
          extendsDataType: "text",
          valueFormatter: (params) => formatJSON(params.value),
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
  createEffect(() => {
    // delete the rows from the table on deletion success in indexedDB
    if (deleteOperation.isSuccess) {
      untrack(() => {
        const rows = tableMutationStore.selectedObjectIDs.map((row) => {
          return Object.fromEntries(
            row.map(({ name, value }) => [name, value]),
          );
        });
        gridApi.applyTransaction({ remove: rows });
        setSelectedObjectIDs([]);
        resetDeleteOperation();
      });
    }
  });
  onMount(() => {
    tableContainer.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        // The escape key is used by the grid to cancel edits. But,
        // in chrome devtools, clicking Escape brings out the bottom devtools
        // drawer with other devtools panels (like console, ...). So, the event
        // propagation is stopped to avoid that
        event.stopPropagation();
      }
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
  createEffect(() => {
    if (settings.autosizeColumns === "fit-cell-contents") {
      gridApi.autoSizeAllColumns({
        defaultMinWidth: 50,
        defaultMaxWidth: 1000,
      });
    } else {
      gridApi.sizeColumnsToFit({ defaultMinWidth: 100, defaultMaxWidth: 500 });
    }
  });
  // allow shift+R to reload the store data
  const reloadStore = (event: KeyboardEvent) => {
    if (
      event.key === "R" &&
      event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey
    ) {
      refetch();
    }
  };
  onMount(() => document.addEventListener("keydown", reloadStore));
  onCleanup(() => document.removeEventListener("keydown", reloadStore));

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

interface TableProps {
  columns: TableColumn[];
  rows: TableRow[];
  keypath: string[];
  activeStore: ActiveObjectStore;
}
