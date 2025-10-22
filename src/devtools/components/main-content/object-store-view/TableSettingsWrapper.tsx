import { FlowProps } from "solid-js";

import styles from "./TableSettingsWrapper.module.css";

export default function TableSettingsWrapper(props: FlowProps) {
  return <div class={styles.wrapper}>{props.children}</div>;
}
