import { Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useIndexedDBContext } from "@/devtools/components/indexeddb-context";
import { useSidebarContext } from "@/devtools/components/sidebar/sidebar-context";
import SingleLineText from "@/devtools/components/SingleLineText";
import CloseSidebarIcon from "@/devtools/components/svg-icons/CloseSidebarIcon";
import ReloadIcon from "@/devtools/components/svg-icons/ReloadIcon";

import styles from "./SidebarHeader.module.css";

export default function SidebarHeader() {
  const { closeSidebar } = useSidebarContext();
  const { databases, refetchIndexedDBs } = useIndexedDBContext();

  return (
    <h1 class={styles.header}>
      <UnstyledButton
        class={styles["sidebar-icon"]}
        title="Close sidebar"
        onClick={() => {
          closeSidebar();
        }}
      >
        <CloseSidebarIcon />
      </UnstyledButton>
      <SingleLineText text="IndexedDBs" />
      <UnstyledButton
        class={styles["reload-icon"]}
        title={
          databases.loading ? "Fetching database list" : "Reload database list"
        }
        onClick={() => {
          refetchIndexedDBs();
        }}
        loading={databases.loading}
      >
        <Show when={!databases.loading}>
          <ReloadIcon />
        </Show>
      </UnstyledButton>
    </h1>
  );
}
