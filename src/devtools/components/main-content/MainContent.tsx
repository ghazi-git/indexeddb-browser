import { Match, Show, Switch } from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useIndexedDBContext } from "@/devtools/components/indexeddb-context";
import Breadcrumbs from "@/devtools/components/main-content/breadcrumbs/Breadcrumbs";
import Table from "@/devtools/components/main-content/object-store-view/Table";
import TableControls from "@/devtools/components/main-content/object-store-view/TableControls";
import ShowSidebarButton from "@/devtools/components/main-content/ShowSidebarButton";

import styles from "./MainContent.module.css";

export default function MainContent() {
  const { databases } = useIndexedDBContext();
  const { activeObjectStore } = useActiveObjectStoreContext();

  return (
    <main class={styles["main-content"]}>
      <div class={styles.header}>
        <ShowSidebarButton />
        <Show when={databases()?.length}>
          <Breadcrumbs databases={databases()!} />
        </Show>
      </div>
      <Switch>
        <Match when={databases.loading}>
          <div class={styles["no-databases"]}>Checking for IndexedDBs...</div>
        </Match>
        <Match when={databases.error}>
          <div class={`${styles["no-databases"]} ${styles.error}`}>
            Unable to get the IndexedDB list.
          </div>
        </Match>
        <Match when={databases()}>
          {(dbs) => (
            <Show
              when={dbs().length}
              fallback={
                <div class={styles["no-databases"]}>
                  No IndexedDB found. Click the refresh icon in the sidebar to
                  check again.
                </div>
              }
            >
              <Show
                when={activeObjectStore()}
                fallback={
                  <div class={styles["no-active-store"]}>
                    Select an object store using the header or the sidebar to
                    view its data.
                  </div>
                }
              >
                {(activeStore) => (
                  <>
                    <TableControls activeStore={activeStore()} />
                    <Table />
                  </>
                )}
              </Show>
            </Show>
          )}
        </Match>
      </Switch>
    </main>
  );
}
