import { JSX } from "solid-js";

import styles from "./CheckboxCell.module.css";

export default function CheckboxCell(props: CheckboxCellProps) {
  let ref!: HTMLInputElement;

  return (
    <td
      class={styles["checkbox-cell"]}
      onClick={(event) => {
        if (event.target !== ref) ref.click();
      }}
    >
      <span class={styles["centered-checkbox"]}>
        <input ref={ref} type="checkbox" {...props} />
      </span>
    </td>
  );
}

type CheckboxCellProps = JSX.InputHTMLAttributes<HTMLInputElement>;
