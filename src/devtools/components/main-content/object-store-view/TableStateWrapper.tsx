import { Match, Switch } from "solid-js";

import MainContentBanner from "@/devtools/components/main-content/MainContentBanner";
import Table from "@/devtools/components/main-content/object-store-view/Table";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { TableSettingsContextProvider } from "@/devtools/components/main-content/object-store-view/table-settings-context";
import TableControls from "@/devtools/components/main-content/object-store-view/TableControls";
import { TableData } from "@/devtools/utils/create-table-query";

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
        {(data) => <TableWrapper tableData={data()} />}
      </Match>
    </Switch>
  );
}

function TableWrapper(props: { tableData: TableData }) {
  const table = () => {
    if (!props.tableData.canDisplay) return undefined;
    if (props.tableData.rows.length === 0) return null;

    return { columns: props.tableData.columns, rows: props.tableData.rows };
  };

  return (
    <Switch>
      <Match when={table() === undefined}>
        <MainContentBanner>
          <span>
            This object store has no keypath. This <i>usually</i> means that it
            has data not suitable for display in a table. Use the native
            IndexedDB viewer instead.
          </span>
        </MainContentBanner>
      </Match>
      <Match when={table() === null}>
        <MainContentBanner>
          This object store has no data yet.
        </MainContentBanner>
      </Match>
      <Match when={table()}>
        {(t) => (
          <TableSettingsContextProvider>
            <TableControls />
            <Table rows={t().rows} columns={t().columns} />
          </TableSettingsContextProvider>
        )}
      </Match>
    </Switch>
  );
}
