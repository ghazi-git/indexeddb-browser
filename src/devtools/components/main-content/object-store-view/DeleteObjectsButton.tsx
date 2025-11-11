import { createMemo, Match, Show, Switch } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import {
  SelectedObjectID,
  useTableMutationContext,
} from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import CloseIcon from "@/devtools/components/svg-icons/CloseIcon";
import DeleteIcon from "@/devtools/components/svg-icons/DeleteIcon";
import LoadingIcon from "@/devtools/components/svg-icons/LoadingIcon";
import {
  DATA_MUTATION_ERROR_MSG,
  generateRequestID,
} from "@/devtools/utils/inspected-window-helpers";
import { ActiveObjectStore, DataKey } from "@/devtools/utils/types";

import styles from "./DeleteObjectsButton.module.css";

export default function DeleteObjectsButton(props: {
  activeStore: ActiveObjectStore;
}) {
  const { tableMutationStore, setErrorMsg, deleteOperation, deleteData } =
    useTableMutationContext();
  const canDelete = () => tableMutationStore.selectedObjectIDs.length > 0;
  const deletionMsg = () => {
    const count = tableMutationStore.selectedObjectIDs.length;
    if (count === 1) {
      return "Are you sure you want to delete the selected object?";
    } else if (count > 1) {
      return `Are you sure you want to delete the ${count} selected objects?`;
    } else {
      return "No objects selected";
    }
  };
  const validObjectKeys = createMemo(() => {
    try {
      return getObjectKeys(tableMutationStore.selectedObjectIDs);
    } catch {
      return [];
    }
  });

  return (
    <>
      <UnstyledButton
        class={styles["dialog-trigger"]}
        title="Delete Selected Object(s)"
        aria-label="Delete Selected Object(s)"
        disabled={!canDelete()}
        command="show-modal"
        commandfor="delete-objects-modal"
      >
        <Show when={!deleteOperation.isLoading} fallback={<LoadingIcon />}>
          <DeleteIcon />
        </Show>
      </UnstyledButton>
      <dialog id="delete-objects-modal" class={styles.dialog} closedby="any">
        <header>
          <h2>Delete Objects</h2>
          <UnstyledButton
            title="Close Modal"
            aria-label="Close Modal"
            command="close"
            commandfor="delete-objects-modal"
          >
            <CloseIcon />
          </UnstyledButton>
        </header>
        <Switch>
          <Match when={!canDelete()}>
            <div>No objects selected.</div>
          </Match>
          <Match when={!validObjectKeys().length}>
            <div>
              Unable to determine the object keys. This might be due to key
              columns datatypes. The valid key datatypes are string, number,
              date and timestamp. Also, ensure the key columns datatypes match
              those in indexedDB (timestamp is automatically converted to number
              by the extension).
            </div>
          </Match>
          <Match when={validObjectKeys().length}>
            <div>{deletionMsg()}</div>
            <footer>
              <UnstyledButton command="close" commandfor="delete-objects-modal">
                Cancel
              </UnstyledButton>
              <UnstyledButton
                command="close"
                commandfor="delete-objects-modal"
                onClick={async () => {
                  try {
                    await deleteData({
                      requestID: generateRequestID(),
                      dbName: props.activeStore.dbName,
                      storeName: props.activeStore.storeName,
                      keys: validObjectKeys(),
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

function getObjectKeys(objectIDs: SelectedObjectID[]) {
  return objectIDs.map((objectID) => {
    return objectID.map((cell) => {
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
