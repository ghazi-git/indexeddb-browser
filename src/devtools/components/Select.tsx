import { JSX, splitProps } from "solid-js";

import { registerEscapeHandler } from "@/devtools/utils/escape-handler";

export default function Select(props: SelectProps) {
  const [local, rest] = splitProps(props, ["ref"]);
  let ref: HTMLSelectElement;
  registerEscapeHandler(() => ref);

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
