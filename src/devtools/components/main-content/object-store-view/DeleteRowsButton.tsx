import { createMemo, Match, Show, Switch } from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import {
  SelectedRowID,
  useTableMutationContext,
} from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import CloseIcon from "@/devtools/components/svg-icons/CloseIcon";
import DeleteIcon from "@/devtools/components/svg-icons/DeleteIcon";
import LoadingIcon from "@/devtools/components/svg-icons/LoadingIcon";
import {
  DATA_MUTATION_ERROR_MSG,
  generateRequestID,
} from "@/devtools/utils/inspected-window-helpers";
import { DataKey } from "@/devtools/utils/types";

import styles from "./DeleteRowsButton.module.css";

export default function DeleteRowsButton() {
  const { activeObjectStore } = useActiveObjectStoreContext();
  const { tableMutationStore, setErrorMsg, deleteOperation, deleteData } =
    useTableMutationContext();
  const canDelete = () => tableMutationStore.selectedRowIDs.length > 0;
  const deletionMsg = () => {
    const count = tableMutationStore.selectedRowIDs.length;
    if (count === 1) {
      return "Are you sure you want to delete the selected row?";
    } else if (count > 1) {
      return `Are you sure you want to delete the ${count} selected rows?`;
    } else {
      return "No rows selected";
    }
  };
  const validRowKeys = createMemo(() => {
    try {
      return getRowKeys(tableMutationStore.selectedRowIDs);
    } catch {
      return [];
    }
  });

  return (
    <>
      <UnstyledButton
        class={styles["dialog-trigger"]}
        title="Delete Selected Row(s)"
        aria-label="Delete Selected Row(s)"
        disabled={!canDelete()}
        command="show-modal"
        commandfor="delete-rows-modal"
      >
        <Show when={!deleteOperation.isLoading} fallback={<LoadingIcon />}>
          <DeleteIcon />
        </Show>
      </UnstyledButton>
      <dialog id="delete-rows-modal" class={styles.dialog} closedby="any">
        <header>
          <h2>Delete Rows</h2>
          <UnstyledButton
            title="Close Modal"
            aria-label="Close Modal"
            command="close"
            commandfor="delete-rows-modal"
          >
            <CloseIcon />
          </UnstyledButton>
        </header>
        <Switch>
          <Match when={!canDelete()}>
            <div>No rows selected.</div>
          </Match>
          <Match when={!validRowKeys().length}>
            <div>
              Unable to determine the row keys. This might be due to key columns
              datatypes. The valid key datatypes are string, number, date and
              timestamp. Also, ensure the key columns datatypes match those in
              indexedDB (timestamp is automatically converted to number by the
              extension).
            </div>
          </Match>
          <Match when={validRowKeys().length}>
            <div>{deletionMsg()}</div>
            <footer>
              <UnstyledButton command="close" commandfor="delete-rows-modal">
                Cancel
              </UnstyledButton>
              <UnstyledButton
                command="close"
                commandfor="delete-rows-modal"
                onClick={async () => {
                  const activeObject = activeObjectStore();
                  if (!activeObject) {
                    const msg = `Unable to determine the object store selected.`;
                    setErrorMsg(msg);
                    return;
                  }

                  try {
                    await deleteData({
                      requestID: generateRequestID(),
                      dbName: activeObject.dbName,
                      storeName: activeObject.storeName,
                      keys: validRowKeys(),
                    });
                  } catch (e) {
                    const msg =
                      e instanceof Error ? e.message : DATA_MUTATION_ERROR_MSG;
                    setErrorMsg(msg);
                  }
                }}
              >
                Delete
              </UnstyledButton>
            </footer>
          </Match>
        </Switch>
      </dialog>
    </>
  );
}

function getRowKeys(rowIDs: SelectedRowID[]) {
  return rowIDs.map((rowID) => {
    return rowID.map((cell) => {
      if (
        cell.datatype !== "string" &&
        cell.datatype !== "number" &&
        cell.datatype !== "timestamp" &&
        cell.datatype !== "date"
      ) {
        throw new Error("Invalid key column datatype");
      }
      if (cell.value == null) throw new Error("Invalid key column value");

      return { datatype: cell.datatype, value: cell.value } as DataKey;
    });
  });
}
