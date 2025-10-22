import { createSignal } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import ColumnsConfig from "@/devtools/components/main-content/object-store-view/ColumnsConfig";
import PaginationSetting from "@/devtools/components/main-content/object-store-view/PaginationSetting";
import TriangleIcon from "@/devtools/components/svg-icons/TriangleIcon";

import styles from "./TableSettingsButton.module.css";

export default function TableSettingsButton() {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <>
      <UnstyledButton
        class={`${styles["popover-trigger"]} ${isOpen() ? styles.open : ""}`}
        popovertarget="columns-popover"
      >
        Columns
        <TriangleIcon orientation={isOpen() ? "up" : "down"} />
      </UnstyledButton>
      <div
        class={styles.popover}
        popover
        id="columns-popover"
        onToggle={(event) => {
          setIsOpen(event.newState === "open");
        }}
      >
        <ColumnsConfig />
        <PaginationSetting />
      </div>
    </>
  );
}
