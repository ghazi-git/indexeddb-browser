import { JSX } from "solid-js";

import ModalDeleteButton from "@/devtools/components/buttons/ModalDeleteButton";
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
  const { reloadTableData } = useTableReloadContext();
  const { tree } = useDatabaseTreeContext();
  const { store, registerModalRef, clearStoreMutation, clearStore } =
    useClearStoreContext();

  const msg = () => {
    if (store.trigger) {
      const db = tree.databases[store.trigger.dbIndex];
      const storeName = db.objectStores[store.trigger.storeIndex].name;
      return `Are you sure you want to delete all objects stored in '${storeName}'?`;
    } else {
      return "Unable to determine the store to be cleared.";
    }
  };

  return (
    <Modal
      ref={(elt) => registerModalRef(elt)}
      id="clear-store-sidebar-modal"
      onClose={(e) => props.onClose(e)}
    >
      <ModalHeader title="Clear Store" modalId="clear-store-sidebar-modal" />
      <div>{msg()}</div>
      <ModalFooter>
        <ModalCancelButton modalId="clear-store-sidebar-modal" />
        <ModalDeleteButton
          loading={clearStoreMutation.isLoading}
          onClick={() => {
            if (store.trigger) {
              const db = tree.databases[store.trigger.dbIndex];
              const dbName = db.name;
              const storeName = db.objectStores[store.trigger.storeIndex].name;
              clearStore({
                requestID: generateRequestID(),
                dbName,
                storeName,
              }).then(() => {
                store.modalRef?.close();
                reloadTableData();
              });
            }
          }}
        >
          Clear
        </ModalDeleteButton>
      </ModalFooter>
    </Modal>
  );
}

interface ClearStoreSidebarModalProps {
  onClose: JSX.EventHandler<HTMLDialogElement, Event>;
}
