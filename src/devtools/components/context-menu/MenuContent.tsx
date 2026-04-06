import { ContextMenu } from "@kobalte/core/context-menu";
import { FlowProps } from "solid-js";

import styles from "./MenuContent.module.css";

export default function MenuContent(props: FlowProps) {
  return (
    <ContextMenu.Content class={styles.menu}>
      {props.children}
    </ContextMenu.Content>
  );
}
