import { For, JSX, Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import CloseIcon from "@/devtools/components/svg-icons/CloseIcon";

import styles from "./ErrorAlert.module.css";

export default function ErrorAlert(props: ErrorAlertProps) {
  const errors = () => {
    return typeof props.errorMsg === "string"
      ? [props.errorMsg]
      : props.errorMsg;
  };

  return (
    <div
      class={`${styles.alert} ${props.useMonoFont && styles.mono}`}
      role="alert"
    >
      <Show
        when={errors().length !== 1}
        fallback={<div innerText={errors()[0]} />}
      >
        <ul>
          <For each={errors()}>{(error) => <li innerText={error} />}</For>
        </ul>
      </Show>

      <UnstyledButton
        class={styles.close}
        onClick={(event) => {
          props.onClick?.(event);
        }}
        aria-label="Dismiss error alert"
      >
        <CloseIcon />
      </UnstyledButton>
    </div>
  );
}

interface ErrorAlertProps {
  errorMsg: string | string[];
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
  useMonoFont?: boolean;
}
