import { createSignal } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
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
      <div
        id="columns-popover"
        class={styles.popover}
        popover
        onToggle={(event) => {
          setIsOpen(event.newState === "open");
        }}
      >
        <div>Column1</div>
        <div>Column2</div>
        <div>Column3</div>
        <div>Column4</div>
        <div>Column5</div>
        <div>Column6</div>
      </div>
    </>
  );
}
