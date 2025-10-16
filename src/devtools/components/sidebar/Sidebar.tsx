import { Match, Show, Switch } from "solid-js";

import DatabaseTree from "@/devtools/components/sidebar/database-tree/DatabaseTree";
import { useSidebarContext } from "@/devtools/components/sidebar/sidebar-context";
import SidebarHeader from "@/devtools/components/sidebar/SidebarHeader";
import SingleLineText from "@/devtools/components/SingleLineText";
import { useIndexedDBContext } from "@/devtools/utils/indexeddb-context";

import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const { sidebar } = useSidebarContext();
  const { databases } = useIndexedDBContext();

  return (
    <aside
      class={styles.sidebar}
      classList={{ [styles.closed]: !sidebar.isOpen }}
    >
      <SidebarHeader />
      <Switch>
        <Match when={databases.loading}>
          <SingleLineText
            class={styles["no-databases"]}
            text="Loading databases..."
          />
        </Match>
        <Match when={databases.error}>
          <SingleLineText
            class={styles.error}
            text="Unable to get the database list."
          />
        </Match>
        <Match when={databases()}>
          {(dbs) => (
            <Show
              when={dbs().length}
              fallback={
                <SingleLineText
                  class={styles["no-databases"]}
                  text="No databases found"
                />
              }
            >
              <DatabaseTree initialData={dbs()} />
            </Show>
          )}
        </Match>
      </Switch>
    </aside>
  );
}
