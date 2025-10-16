import { JSX, Show, splitProps } from "solid-js";

import LoadingIcon from "@/devtools/components/svg-icons/LoadingIcon";

import styles from "./UnstyledButton.module.css";

export default function UnstyledButton(props: ButtonProps) {
  const [local, btnProps] = splitProps(props, ["class", "loading", "children"]);
  return (
    <button
      type="button"
      class={`${styles.unstyled} ${local.class ?? ""}`}
      disabled={local.loading}
      {...btnProps}
    >
      {local.children}
      <Show when={local.loading}>
        <LoadingIcon class={styles.loading} />
      </Show>
    </button>
  );
}

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}
