import { ContextMenu } from "@kobalte/core/context-menu";
import { FlowProps } from "solid-js";

import styles from "./ModalTriggerMenuItem.module.css";

export default function ModalTriggerMenuItem(props: ModalTriggerMenuItemProps) {
  return (
    <ContextMenu.Item
      class={styles.item}
      as="button"
      command="show-modal"
      commandfor={props.modalId}
      disabled={props.disabled}
      onSelect={() => props.onSelect()}
    >
      {props.children}
    </ContextMenu.Item>
  );
}

interface ModalTriggerMenuItemProps extends FlowProps {
  modalId: string;
  disabled: boolean;
  onSelect: () => void;
}
