import { JSX, Show, splitProps } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import LoadingIcon from "@/devtools/components/svg-icons/LoadingIcon";

import styles from "./DeleteButton.module.css";

export default function DeleteButton(props: DeleteButtonProps) {
  const [local, rest] = splitProps(props, ["class", "children", "loading"]);

  return (
    <UnstyledButton
      class={`${styles.delete} ${local.class ?? ""}`}
      disabled={local.loading}
      {...rest}
    >
      {local.children}
      <Show when={local.loading}>
        <LoadingIcon />
      </Show>
    </UnstyledButton>
  );
}

interface DeleteButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}
