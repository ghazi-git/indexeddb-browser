import { Match, Show, Switch } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useIndexedDBContext } from "@/devtools/components/indexeddb-context";
import Breadcrumbs from "@/devtools/components/main-content/breadcrumbs/Breadcrumbs";
import { useSidebarContext } from "@/devtools/components/sidebar/sidebar-context";
import OpenSidebarIcon from "@/devtools/components/svg-icons/OpenSidebarIcon";

import styles from "./MainContentHeader.module.css";

export default function MainContentHeader() {
  const { sidebar, openSidebar } = useSidebarContext();
  const { databases } = useIndexedDBContext();

  return (
    <div class={styles.header}>
      <Show when={!sidebar.isOpen}>
        <UnstyledButton
          class={styles["sidebar-icon"]}
          title="Open sidebar"
          onClick={() => {
            openSidebar();
          }}
        >
          <OpenSidebarIcon />
        </UnstyledButton>
      </Show>
      <Switch>
        <Match when={databases.loading}>
          <div class={styles["no-databases"]}>Loading databases...</div>
        </Match>
        <Match when={databases.error}>
          <div class={styles.error}>Unable to get the database list.</div>
        </Match>
        <Match when={databases()}>
          {(dbs) => (
            <Show
              when={dbs().length}
              fallback={
                <div class={styles["no-databases"]}>No databases found</div>
              }
            >
              <Breadcrumbs databases={dbs()} />
            </Show>
          )}
        </Match>
      </Switch>
    </div>
  );
}
