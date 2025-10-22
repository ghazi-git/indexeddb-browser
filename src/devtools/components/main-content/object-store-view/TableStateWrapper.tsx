import {
  AllCommunityModule,
  ColDef,
  GridOptions,
  ModuleRegistry,
} from "ag-grid-community";
import { Match, Switch } from "solid-js";

import MainContentBanner from "@/devtools/components/main-content/MainContentBanner";
import Table from "@/devtools/components/main-content/object-store-view/Table";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { TableSearchContextProvider } from "@/devtools/components/main-content/object-store-view/table-search-context";
import TableControls from "@/devtools/components/main-content/object-store-view/TableControls";
import { TableData, TableRow } from "@/devtools/utils/create-table-query";
import {
  convertTimestampToString,
  convertToString,
  TableCellRenderer,
  TimestampRenderer,
} from "@/devtools/utils/table-cell-renderer";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function TableStateWrapper() {
  const { query } = useTableContext();

  return (
    <Switch>
      <Match when={query.isLoading}>
        <MainContentBanner>Loading object store data ...</MainContentBanner>
      </Match>
      <Match when={query.isError}>
        <MainContentBanner isError={true}>{query.errorMsg}</MainContentBanner>
      </Match>
      <Match when={query.data}>
        {(data) => <GridOptionsWrapper tableData={data()} />}
      </Match>
    </Switch>
  );
}

function GridOptionsWrapper(props: { tableData: TableData }) {
  const initialGridOptions = (): GridOptions<TableRow> | undefined | null => {
    if (!props.tableData.canDisplay) return undefined;
    if (props.tableData.rows.length === 0) return null;

    const columnDefs: ColDef[] = props.tableData.columns.map(
      (column) =>
        ({
          field: column.name,
          headerName: column.isTimestamp ? `${column.name} ⏱` : column.name,
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
    return {
      rowData: props.tableData.rows,
      columnDefs,
      defaultColDef: { flex: 1 },
      tooltipShowDelay: 1000,
      cacheQuickFilter: true,
      pagination: true,
      paginationPageSizeSelector: [20, 100, 500, 1000],
      paginationPageSize: 20,
    };
  };

  return (
    <Switch>
      <Match when={initialGridOptions() === undefined}>
        <MainContentBanner>
          <span>
            This object store has no keypath. This <i>usually</i> means that it
            has data not suitable for display in a table. Use the native
            IndexedDB viewer instead.
          </span>
        </MainContentBanner>
      </Match>
      <Match when={initialGridOptions() === null}>
        <MainContentBanner>
          This object store has no data yet.
        </MainContentBanner>
      </Match>
      <Match when={initialGridOptions()}>
        {(options) => (
          <TableSearchContextProvider>
            <TableControls />
            <Table initialGridOptions={options()} />
          </TableSearchContextProvider>
        )}
      </Match>
    </Switch>
  );
}
