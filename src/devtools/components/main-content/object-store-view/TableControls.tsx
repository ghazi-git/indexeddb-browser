import { ActiveObjectStore } from "@/devtools/components/active-object-store-context";
import ColumnsButton from "@/devtools/components/main-content/object-store-view/ColumnsButton";

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
      <ColumnsButton />
    </div>
  );
}
