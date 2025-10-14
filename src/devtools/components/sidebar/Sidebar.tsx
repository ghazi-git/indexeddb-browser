import { Show } from "solid-js";

import DatabaseTree from "@/devtools/components/sidebar/DatabaseTree";
import { useSidebarContext } from "@/devtools/components/sidebar/sidebar-context";
import SidebarHeader from "@/devtools/components/sidebar/SidebarHeader";
import SingleLineText from "@/devtools/components/SingleLineText";

import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const { sidebar } = useSidebarContext();

  return (
    <aside
      class={styles.sidebar}
      classList={{ [styles.closed]: !sidebar.isOpen }}
    >
      <SidebarHeader />
      <Show
        when={sidebar.databases.length}
        fallback={
          <SingleLineText
            class={styles["no-databases"]}
            text="No databases Found"
          />
        }
      >
        <DatabaseTree />
      </Show>
    </aside>
  );
}
