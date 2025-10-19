import { Show } from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import Breadcrumbs from "@/devtools/components/main-content/header/Breadcrumbs";
import MainContentHeader from "@/devtools/components/main-content/header/MainContentHeader";
import MainContentBanner from "@/devtools/components/main-content/MainContentBanner";
import MainContentContainer from "@/devtools/components/main-content/MainContentContainer";
import Table from "@/devtools/components/main-content/object-store-view/Table";
import TableControls from "@/devtools/components/main-content/object-store-view/TableControls";
import { IndexedDB } from "@/devtools/utils/dummy-data";

export default function ObjectStoreView(props: { databases: IndexedDB[] }) {
  const { activeObjectStore } = useActiveObjectStoreContext();

  return (
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
          <>
            <TableControls activeStore={activeStore()} />
            <Table />
          </>
        )}
      </Show>
    </MainContentContainer>
  );
}
