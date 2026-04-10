import { Show } from "solid-js";

import ErrorAlert from "@/devtools/components/main-content/object-store-view/ErrorAlert";
import { useTableMutationContext } from "@/devtools/components/main-content/object-store-view/table-mutation-context";

import styles from "./TableError.module.css";

export default function TableError() {
  const { tableMutationStore, setErrorMsg } = useTableMutationContext();

  return (
    <Show when={tableMutationStore.errorMsg}>
      {(msg) => (
        <ErrorAlert
          class={styles.error}
          errorMsg={msg()}
          onClick={() => {
            setErrorMsg(null);
          }}
        />
      )}
    </Show>
  );
}
