import { createMemo, Match, Show, Switch } from "solid-js";

import ButtonWithBorder from "@/devtools/components/buttons/ButtonWithBorder";
import ModalDeleteButton from "@/devtools/components/buttons/ModalDeleteButton";
import { useTableMutationContext } from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import Modal from "@/devtools/components/modal/Modal";
import ModalCancelButton from "@/devtools/components/modal/ModalCancelButton";
import ModalFooter from "@/devtools/components/modal/ModalFooter";
import ModalHeader from "@/devtools/components/modal/ModalHeader";
import DeleteIcon from "@/devtools/components/svg-icons/DeleteIcon";
import LoadingIcon from "@/devtools/components/svg-icons/LoadingIcon";
import { getIndexedDBKey } from "@/devtools/utils/grid-options";
import {
  DATA_MUTATION_ERROR_MSG,
  generateRequestID,
} from "@/devtools/utils/inspected-window-helpers";
import { ActiveObjectStore, TableColumn } from "@/devtools/utils/types";

import styles from "./DeleteObjectsButton.module.css";

export default function DeleteObjectsButton(props: DeleteObjectsButtonProps) {
  const { tableMutationStore, setErrorMsg, deleteOperation, deleteData } =
    useTableMutationContext();
  const canDelete = () => tableMutationStore.selectedObjects.length > 0;
  const deletionMsg = () => {
    const count = tableMutationStore.selectedObjects.length;
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
      return tableMutationStore.selectedObjects.map((obj) =>
        getIndexedDBKey(props.keypath, props.columns, obj),
      );
    } catch {
      return [];
    }
  });

  return (
    <>
      <ButtonWithBorder
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
      </ButtonWithBorder>
      <Modal id="delete-objects-modal" closedby="any">
        <ModalHeader title="Delete Objects" modalId="delete-objects-modal" />
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
            <ModalFooter>
              <ModalCancelButton modalId="delete-objects-modal" />
              <ModalDeleteButton
                command="close"
                commandfor="delete-objects-modal"
                onClick={() => {
                  deleteData({
                    requestID: generateRequestID(),
                    dbName: props.activeStore.dbName,
                    storeName: props.activeStore.storeName,
                    keys: validObjectKeys(),
                  }).catch((e) => {
                    const msg =
                      e instanceof Error ? e.message : DATA_MUTATION_ERROR_MSG;
                    setErrorMsg(msg);
                  });
                }}
              >
                Delete
              </ModalDeleteButton>
            </ModalFooter>
          </Match>
        </Switch>
      </Modal>
    </>
  );
}

interface DeleteObjectsButtonProps {
  activeStore: ActiveObjectStore;
  keypath: string[];
  columns: TableColumn[];
}
