import { onCleanup, onMount } from "solid-js";

export function registerEscapeHandler(elt: () => HTMLElement) {
  const handler = (event: KeyboardEvent) => {
    if (event.key === "Escape" && elt().contains(event.target as HTMLElement)) {
      // prevent bringing up the bottom tools drawer of the chrome devtools
      event.stopPropagation();
    }
  };
  onMount(() => window.addEventListener("keydown", handler, true));
  onCleanup(() => window.removeEventListener("keydown", handler, true));
}
