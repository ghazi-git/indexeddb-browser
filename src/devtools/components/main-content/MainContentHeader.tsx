import { Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import BreadcrumbSelect from "@/devtools/components/main-content/breadcrumbs/BreadcrumbSelect";
import ReloadStore from "@/devtools/components/main-content/breadcrumbs/ReloadStore";
import { useSidebarContext } from "@/devtools/components/sidebar/sidebar-context";
import AngleRightIcon from "@/devtools/components/svg-icons/AngleRightIcon";
import OpenSidebarIcon from "@/devtools/components/svg-icons/OpenSidebarIcon";

import styles from "./MainContentHeader.module.css";

export default function MainContentHeader() {
  const { sidebar, openSidebar } = useSidebarContext();
  const options = [
    { label: "Select IndexedDB", value: "---" },
    { label: "Option 1", value: "option1" },
    { label: "Option Option 2", value: "option2" },
    { label: "Option 3", value: "option3" },
    { label: "Option Opt 4", value: "option4" },
    { label: "Option 5", value: "option5" },
  ];

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
      <BreadcrumbSelect options={options} />
      <div class={styles["angle-right-icon"]}>
        <AngleRightIcon />
      </div>
      <BreadcrumbSelect options={options} />
      <ReloadStore />
    </div>
  );
}
