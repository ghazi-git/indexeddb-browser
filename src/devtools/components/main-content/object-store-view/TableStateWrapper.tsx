import { Match, Show, Switch } from "solid-js";

import MainContentBanner from "@/devtools/components/main-content/MainContentBanner";
import AddEditObjectsWithInLineKeys from "@/devtools/components/main-content/object-store-view/AddEditObjectsWithInLineKeys";
import DeleteObjectsButton from "@/devtools/components/main-content/object-store-view/DeleteObjectsButton";
import Table from "@/devtools/components/main-content/object-store-view/Table";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { TableMutationContextProvider } from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import { TableSettingsContextProvider } from "@/devtools/components/main-content/object-store-view/table-settings/context";
import TableSettingsButton from "@/devtools/components/main-content/object-store-view/table-settings/TableSettingsButton";
import TableError from "@/devtools/components/main-content/object-store-view/TableError";
import TableSearch from "@/devtools/components/main-content/object-store-view/TableSearch";
import TableSettingsWrapper from "@/devtools/components/main-content/object-store-view/TableSettingsWrapper";
import { TableData } from "@/devtools/utils/types";

export default function TableStateWrapper() {
  const { query } = useTableContext();

  return (
    <TableSettingsContextProvider>
      <TableMutationContextProvider>
        <Show when={query.data}>
          {(data) => (
            <TableSettingsWrapper>
              <TableSearch />
              <Show when={data().rows?.length}>
                <DeleteObjectsButton
                  activeStore={data().activeStore}
                  keypath={data().keypath}
                  columns={data().columns}
                />
              </Show>
              <AddEditObjectsWithInLineKeys
                columns={data().columns}
                activeStore={data().activeStore}
              />
              <TableSettingsButton />
            </TableSettingsWrapper>
          )}
        </Show>
        <Switch>
          <Match when={query.isLoading}>
            <MainContentBanner>{query.loadingMsg}</MainContentBanner>
          </Match>
          <Match when={query.isError}>
            <MainContentBanner isError={true}>
              {query.errorMsg}
            </MainContentBanner>
          </Match>
          <Match when={query.data}>
            {(data) => <TableWrapper tableData={data()} />}
          </Match>
        </Switch>
      </TableMutationContextProvider>
    </TableSettingsContextProvider>
  );
}

function TableWrapper(props: { tableData: TableData }) {
  return (
    <Show
      when={props.tableData.rows}
      fallback={
        <MainContentBanner isError={true}>
          <h1>Unable to retrieve the data.</h1>
          <p>
            This might be due to the object store containing unsupported
            datatypes. The supported datatypes are primitive datatypes (string,
            number, boolean, bigint), dates and objects/arrays holding primitive
            datatypes. If you know which columns have unsupported datatypes,
            open the "Table Settings" dropdown and set the datatype as
            "Unsupported". Or, you can use the native IndexedDB viewer instead.
          </p>
        </MainContentBanner>
      }
    >
      {(tableRows) => (
        <>
          <Show
            when={tableRows().length > 0}
            fallback={
              <MainContentBanner>
                This object store has no data yet.
              </MainContentBanner>
            }
          >
            <TableError />
            <Table
              rows={tableRows()}
              columns={props.tableData.columns}
              keypath={props.tableData.keypath}
              activeStore={props.tableData.activeStore}
            />
          </Show>
        </>
      )}
    </Show>
  );
}
