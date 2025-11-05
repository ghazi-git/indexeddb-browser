import { Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useTableMutationContext } from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import CloseIcon from "@/devtools/components/svg-icons/CloseIcon";

import styles from "./TableError.module.css";

export default function TableError() {
  const { tableMutationStore, setErrorMsg } = useTableMutationContext();

  return (
    <Show when={tableMutationStore.errorMsg}>
      <div class={styles.alert}>
        <div>{tableMutationStore.errorMsg}</div>
        <UnstyledButton
          class={styles.close}
          onClick={() => {
            setErrorMsg(null);
          }}
        >
          <CloseIcon />
        </UnstyledButton>
      </div>
    </Show>
  );
}
