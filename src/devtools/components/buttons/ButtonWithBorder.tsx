import { JSX, splitProps } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";

import styles from "./ButtonWithBorder.module.css";

export default function ButtonWithBorder(props: ButtonWithBorderProps) {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <UnstyledButton
      class={`${styles["btn-with-border"]} ${local.class ?? ""}`}
      {...rest}
    />
  );
}

type ButtonWithBorderProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;
