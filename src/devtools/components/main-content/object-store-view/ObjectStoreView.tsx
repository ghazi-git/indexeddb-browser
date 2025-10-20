import { Show } from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import Breadcrumbs from "@/devtools/components/main-content/header/Breadcrumbs";
import MainContentHeader from "@/devtools/components/main-content/header/MainContentHeader";
import MainContentBanner from "@/devtools/components/main-content/MainContentBanner";
import MainContentContainer from "@/devtools/components/main-content/MainContentContainer";
import Table from "@/devtools/components/main-content/object-store-view/Table";
import { TableContextProvider } from "@/devtools/components/main-content/object-store-view/table-context";
import { TableSearchContextProvider } from "@/devtools/components/main-content/object-store-view/table-search-context";
import TableControls from "@/devtools/components/main-content/object-store-view/TableControls";
import { IndexedDB } from "@/devtools/utils/dummy-data";

export default function ObjectStoreView(props: { databases: IndexedDB[] }) {
  const { activeObjectStore } = useActiveObjectStoreContext();

  return (
    <TableContextProvider>
      <MainContentContainer>
        <MainContentHeader>
          <Breadcrumbs databases={props.databases} />
        </MainContentHeader>
        <Show
          when={activeObjectStore()}
          fallback={
            <MainContentBanner>
              Select an object store using the header or the sidebar to view its
              data.
            </MainContentBanner>
          }
        >
          {(activeStore) => (
            <TableSearchContextProvider>
              <TableControls activeStore={activeStore()} />
              <Table />
            </TableSearchContextProvider>
          )}
        </Show>
      </MainContentContainer>
    </TableContextProvider>
  );
}
