import { ContextMenu } from "@kobalte/core/context-menu";
import { FlowProps, onCleanup, onMount } from "solid-js";

import styles from "./MenuContent.module.css";

export default function MenuContent(props: MenuContentProps) {
  let menuRef: HTMLDivElement;
  const handler = (event: KeyboardEvent) => {
    if (
      event.key === "Escape" &&
      menuRef.contains(event.target as HTMLElement)
    ) {
      event.stopPropagation();
      props.closeMenu();
    }
  };
  onMount(() => window.addEventListener("keydown", handler, true));
  onCleanup(() => window.removeEventListener("keydown", handler, true));

  return (
    <ContextMenu.Content
      ref={(elt) => {
        menuRef = elt;
      }}
      class={styles.menu}
      onInteractOutside={() => props.closeMenu()}
    >
      {props.children}
    </ContextMenu.Content>
  );
}

interface MenuContentProps extends FlowProps {
  closeMenu: () => void;
}
