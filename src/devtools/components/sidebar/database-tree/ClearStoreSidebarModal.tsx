import { createEffect, createSignal, JSX, Show } from "solid-js";

import DeleteButton from "@/devtools/components/buttons/DeleteButton";
import ErrorAlert from "@/devtools/components/main-content/object-store-view/ErrorAlert";
import Modal from "@/devtools/components/modal/Modal";
import ModalCancelButton from "@/devtools/components/modal/ModalCancelButton";
import ModalFooter from "@/devtools/components/modal/ModalFooter";
import ModalHeader from "@/devtools/components/modal/ModalHeader";
import { useClearStoreContext } from "@/devtools/components/sidebar/database-tree/clear-store-context";
import { useDatabaseTreeContext } from "@/devtools/components/sidebar/database-tree/database-tree-context";
import { useTableReloadContext } from "@/devtools/components/table-reload-context";
import { generateRequestID } from "@/devtools/utils/inspected-window-helpers";

export default function ClearStoreSidebarModal(
  props: ClearStoreSidebarModalProps,
) {
  let modalRef: HTMLDialogElement;
  const { reloadTableData } = useTableReloadContext();
  const { tree } = useDatabaseTreeContext();
  const { store, clearStoreMutation, clearStore } = useClearStoreContext();

  const msg = () => {
    if (store.storeIndex !== null) {
      const db = tree.databases[store.dbIndex];
      const storeName = db.objectStores[store.storeIndex].name;
      return `Are you sure you want to delete all objects stored in '${storeName}'?`;
    } else {
      return "Unable to determine the store to be cleared.";
    }
  };
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null);
  createEffect(() => {
    if (clearStoreMutation.errorMsg) setErrorMsg(clearStoreMutation.errorMsg);
  });

  return (
    <Modal
      ref={(elt) => {
        modalRef = elt;
      }}
      id="clear-store-sidebar-modal"
      onClose={(e) => {
        props.onClose(e);
        setErrorMsg(null);
      }}
    >
      <ModalHeader title="Clear Store" modalId="clear-store-sidebar-modal" />
      <Show when={errorMsg()}>
        {(error) => (
          <ErrorAlert errorMsg={error()} onClick={() => setErrorMsg(null)} />
        )}
      </Show>
      <div>{msg()}</div>
      <ModalFooter>
        <ModalCancelButton modalId="clear-store-sidebar-modal" />
        <DeleteButton
          loading={clearStoreMutation.isLoading}
          onClick={() => {
            setErrorMsg(null);
            if (store.storeIndex !== null) {
              const db = tree.databases[store.dbIndex];
              const dbName = db.name;
              const storeName = db.objectStores[store.storeIndex].name;
              clearStore({
                requestID: generateRequestID(),
                dbName,
                storeName,
              }).then(() => {
                modalRef.close();
                reloadTableData();
              });
            }
          }}
        >
          Clear
        </DeleteButton>
      </ModalFooter>
    </Modal>
  );
}

interface ClearStoreSidebarModalProps {
  onClose: JSX.EventHandler<HTMLDialogElement, Event>;
}
