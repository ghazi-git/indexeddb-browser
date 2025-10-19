import { ParentProps, Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useSidebarContext } from "@/devtools/components/sidebar/sidebar-context";
import OpenSidebarIcon from "@/devtools/components/svg-icons/OpenSidebarIcon";

import styles from "./MainContentHeader.module.css";

export default function MainContentHeader(props: ParentProps) {
  const { sidebar, openSidebar } = useSidebarContext();

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
      {props.children}
    </div>
  );
}
