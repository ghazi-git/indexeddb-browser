import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useSidebarContext } from "@/devtools/components/sidebar/sidebar-context";
import SingleLineText from "@/devtools/components/SingleLineText";
import CloseSidebarIcon from "@/devtools/components/svg-icons/CloseSidebarIcon";
import RefreshIcon from "@/devtools/components/svg-icons/RefreshIcon";

import styles from "./SidebarHeader.module.css";

export default function SidebarHeader() {
  const { closeSidebar } = useSidebarContext();

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
        class={styles["refresh-icon"]}
        title="Refresh database list"
      >
        <RefreshIcon />
      </UnstyledButton>
    </h1>
  );
}
