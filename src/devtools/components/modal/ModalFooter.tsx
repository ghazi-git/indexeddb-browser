import { FlowProps } from "solid-js";

import styles from "./ModalFooter.module.css";

export default function ModalFooter(props: FlowProps) {
  return <footer class={styles.footer}>{props.children}</footer>;
}
