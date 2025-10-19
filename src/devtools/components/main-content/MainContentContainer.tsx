import { FlowProps } from "solid-js";

import styles from "./MainContentContainer.module.css";

export default function MainContentContainer(props: FlowProps) {
  return <main class={styles["main-content-container"]}>{props.children}</main>;
}
