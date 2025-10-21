import { Show } from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import Breadcrumbs from "@/devtools/components/main-content/header/Breadcrumbs";
import MainContentHeader from "@/devtools/components/main-content/header/MainContentHeader";
import MainContentBanner from "@/devtools/components/main-content/MainContentBanner";
import MainContentContainer from "@/devtools/components/main-content/MainContentContainer";
import { TableContextProvider } from "@/devtools/components/main-content/object-store-view/table-context";
import TableStateWrapper from "@/devtools/components/main-content/object-store-view/TableStateWrapper";
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
          <TableStateWrapper />
        </Show>
      </MainContentContainer>
    </TableContextProvider>
  );
}
