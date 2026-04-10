import { JSX, onCleanup, onMount, splitProps } from "solid-js";

export default function Select(props: SelectProps) {
  const [local, rest] = splitProps(props, ["ref"]);
  let ref: HTMLSelectElement;
  const handler = (event: KeyboardEvent) => {
    if (event.key === "Escape" && ref.contains(event.target as HTMLElement)) {
      // prevent bringing up the bottom tools drawer of the chrome devtools
      event.stopPropagation();
    }
  };
  onMount(() => window.addEventListener("keydown", handler, true));
  onCleanup(() => window.removeEventListener("keydown", handler, true));

  return (
    <select
      ref={(elt) => {
        ref = elt;
        local.ref?.(elt);
      }}
      {...rest}
    />
  );
}

interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  ref?: (elt: HTMLSelectElement) => void;
}
