import { ActiveObjectStore } from "@/devtools/components/active-object-store-context";
import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";

import styles from "./TableControls.module.css";

export default function TableControls(props: {
  activeStore: ActiveObjectStore;
}) {
  return (
    <div class={styles.controls}>
      <input
        type="text"
        placeholder={`Search ${props.activeStore.storeName}`}
      />
      <UnstyledButton>Columns</UnstyledButton>
    </div>
  );
}
