import { JSX, onCleanup, onMount } from "solid-js";

import ModalDeleteButton from "@/devtools/components/buttons/ModalDeleteButton";
import { useIndexedDBContext } from "@/devtools/components/indexeddb-context";
import ModalCancelButton from "@/devtools/components/modal/ModalCancelButton";
import ModalFooter from "@/devtools/components/modal/ModalFooter";
import ModalHeader from "@/devtools/components/modal/ModalHeader";
import { useClearStoreContext } from "@/devtools/components/sidebar/database-tree/clear-store-context";
import { useDatabaseTreeContext } from "@/devtools/components/sidebar/database-tree/database-tree-context";
import { useTableReloadContext } from "@/devtools/components/table-reload-context";
import { generateRequestID } from "@/devtools/utils/inspected-window-helpers";

import styles from "./ClearStoreSidebarModal.module.css";

export default function ClearStoreSidebarModal(
  props: ClearStoreSidebarModalProps,
) {
  const { clearStoreMutation, clearStore } = useIndexedDBContext();
  const { reloadTableData } = useTableReloadContext();
  const { tree } = useDatabaseTreeContext();
  const { store, registerModalRef } = useClearStoreContext();

  const closeModal = (event: KeyboardEvent) => {
    if (
      event.key === "Escape" &&
      store.modalRef?.contains(event.target as HTMLElement)
    ) {
      event.stopPropagation();
      store.modalRef?.close();
    }
  };
  onMount(() => window.addEventListener("keydown", closeModal, true));
  onCleanup(() => window.removeEventListener("keydown", closeModal, true));

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
    <dialog
      ref={(elt) => registerModalRef(elt)}
      id="clear-store-sidebar-modal"
      class={styles.dialog}
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
    </dialog>
  );
}

interface ClearStoreSidebarModalProps {
  onClose: JSX.EventHandler<HTMLDialogElement, Event>;
}
