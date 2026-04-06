import { ContextMenu, ContextMenuItemProps } from "@kobalte/core/context-menu";
import { FlowProps } from "solid-js";

import styles from "./MenuItem.module.css";

export default function MenuItem(props: FlowProps<ContextMenuItemProps>) {
  return (
    <ContextMenu.Item
      class={styles.item}
      onKeyDown={(event) => {
        // allow Enter press to bring up the modal
        if (event.key === "Enter") event.preventDefault();
      }}
      {...props}
    />
  );
}
