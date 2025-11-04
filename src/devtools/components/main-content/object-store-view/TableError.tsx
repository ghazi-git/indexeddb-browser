import { Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useTableEditContext } from "@/devtools/components/main-content/object-store-view/table-edit-context";
import CloseIcon from "@/devtools/components/svg-icons/CloseIcon";

import styles from "./TableError.module.css";

export default function TableError() {
  const { tableEditStore, setErrorMsg } = useTableEditContext();

  return (
    <Show when={tableEditStore.errorMsg}>
      <div class={styles.alert}>
        <div>{tableEditStore.errorMsg}</div>
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
