import { createSignal } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import ColumnsPopover from "@/devtools/components/main-content/object-store-view/ColumnsPopover";
import TriangleIcon from "@/devtools/components/svg-icons/TriangleIcon";

import styles from "./ColumnsButton.module.css";

export default function ColumnsButton() {
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
      <ColumnsPopover
        id="columns-popover"
        onToggle={(event) => {
          setIsOpen(event.newState === "open");
        }}
      />
    </>
  );
}
