import { JSX, splitProps } from "solid-js";

import styles from "./UnstyledButton.module.css";

export default function UnstyledButton(props: ButtonProps) {
  const [local, btnProps] = splitProps(props, ["class", "children"]);
  return (
    <button
      type="button"
      class={`${styles.unstyled} ${local.class ?? ""}`}
      {...btnProps}
    >
      {local.children}
    </button>
  );
}

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;
