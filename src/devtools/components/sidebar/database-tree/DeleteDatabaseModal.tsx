import { createEffect, createSignal, JSX, Show } from "solid-js";

import ModalDeleteButton from "@/devtools/components/buttons/ModalDeleteButton";
import { useIndexedDBContext } from "@/devtools/components/indexeddb-context";
import ErrorAlert from "@/devtools/components/main-content/object-store-view/ErrorAlert";
import Modal from "@/devtools/components/modal/Modal";
import ModalCancelButton from "@/devtools/components/modal/ModalCancelButton";
import ModalFooter from "@/devtools/components/modal/ModalFooter";
import ModalHeader from "@/devtools/components/modal/ModalHeader";
import { useDatabaseTreeContext } from "@/devtools/components/sidebar/database-tree/database-tree-context";
import { useDeleteDatabaseContext } from "@/devtools/components/sidebar/database-tree/delete-database-context";
import { generateRequestID } from "@/devtools/utils/inspected-window-helpers";

export default function DeleteDatabaseModal(props: DeleteDatabaseModalProps) {
  let modalRef: HTMLDialogElement;
  const { refetchIndexedDBs } = useIndexedDBContext();
  const { tree } = useDatabaseTreeContext();
  const { dbToDelete, deleteDBMutation, deleteDB } = useDeleteDatabaseContext();

  const msg = () => {
    const dbIndex = dbToDelete();
    if (dbIndex !== null) {
      const dbName = tree.databases[dbIndex].name;
      return `Are you sure you want to delete the database '${dbName}'?`;
    } else {
      return "Unable to determine the database to be deleted.";
    }
  };
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null);
  createEffect(() => {
    if (deleteDBMutation.errorMsg) setErrorMsg(deleteDBMutation.errorMsg);
  });

  return (
    <Modal
      ref={(elt) => {
        modalRef = elt;
      }}
      id="delete-database-modal"
      onClose={(e) => {
        props.onClose(e);
        setErrorMsg(null);
      }}
    >
      <ModalHeader title="Delete Database" modalId="delete-database-modal" />
      <Show when={errorMsg()}>
        {(error) => (
          <ErrorAlert errorMsg={error()} onClick={() => setErrorMsg(null)} />
        )}
      </Show>
      <div>{msg()}</div>
      <ModalFooter>
        <ModalCancelButton modalId="delete-database-modal" />
        <ModalDeleteButton
          loading={deleteDBMutation.isLoading}
          onClick={() => {
            const dbIndex = dbToDelete();
            if (dbIndex !== null) {
              const dbName = tree.databases[dbIndex].name;
              deleteDB({ requestID: generateRequestID(), dbName }).then(() => {
                modalRef.close();
                refetchIndexedDBs();
              });
            }
          }}
        >
          Delete
        </ModalDeleteButton>
      </ModalFooter>
    </Modal>
  );
}

interface DeleteDatabaseModalProps {
  onClose: JSX.EventHandler<HTMLDialogElement, Event>;
}
