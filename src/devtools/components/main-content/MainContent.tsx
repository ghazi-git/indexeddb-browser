import { Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useSidebarContext } from "@/devtools/components/sidebar/sidebar-context";
import OpenSidebarIcon from "@/devtools/components/svg-icons/OpenSidebarIcon";

import styles from "./MainContent.module.css";

export default function MainContent() {
  const { sidebar, openSidebar } = useSidebarContext();

  return (
    <main class={styles["main-content"]}>
      <h1 class={styles.header}>
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
        <span>No database Selected</span>
      </h1>
    </main>
  );
}
