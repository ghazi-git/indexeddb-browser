import { Show } from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import Breadcrumbs from "@/devtools/components/main-content/header/Breadcrumbs";
import MainContentHeader from "@/devtools/components/main-content/header/MainContentHeader";
import MainContentBanner from "@/devtools/components/main-content/MainContentBanner";
import MainContentContainer from "@/devtools/components/main-content/MainContentContainer";
import StoreActionsDropdown from "@/devtools/components/main-content/object-store-view/StoreActionsDropdown";
import { TableContextProvider } from "@/devtools/components/main-content/object-store-view/table-context";
import TableStateWrapper from "@/devtools/components/main-content/object-store-view/TableStateWrapper";
import { IndexedDB } from "@/devtools/utils/types";

export default function ObjectStoreView(props: { databases: IndexedDB[] }) {
  const { activeObjectStore } = useActiveObjectStoreContext();

  return (
    <TableContextProvider>
      <MainContentContainer>
        <MainContentHeader>
          <Breadcrumbs databases={props.databases} />
          <Show when={activeObjectStore()}>
            {(activeStore) => (
              <StoreActionsDropdown activeStore={activeStore()} />
            )}
          </Show>
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
