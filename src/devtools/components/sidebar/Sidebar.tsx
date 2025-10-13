import { useSidebarContext } from "@/devtools/components/sidebar/sidebar-context";
import SidebarHeader from "@/devtools/components/sidebar/SidebarHeader";

import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const { sidebar } = useSidebarContext();

  return (
    <aside
      class={styles.sidebar}
      classList={{ [styles.closed]: !sidebar.isOpen }}
    >
      <SidebarHeader />
    </aside>
  );
}
