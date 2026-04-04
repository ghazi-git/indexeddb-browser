import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import { createSignal, onCleanup, onMount } from "solid-js";

import ModalDeleteButton from "@/devtools/components/buttons/ModalDeleteButton";
import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useIndexedDBContext } from "@/devtools/components/indexeddb-context";
import ModalCancelButton from "@/devtools/components/modal/ModalCancelButton";
import ModalFooter from "@/devtools/components/modal/ModalFooter";
import ModalHeader from "@/devtools/components/modal/ModalHeader";
import ThreeDotIcon from "@/devtools/components/svg-icons/ThreeDotIcon";
import { useTableReloadContext } from "@/devtools/components/table-reload-context";
import { generateRequestID } from "@/devtools/utils/inspected-window-helpers";
import { ActiveObjectStore } from "@/devtools/utils/types";

import styles from "./StoreActionsDropdown.module.css";

export default function StoreActionsDropdown(props: StoreActionsDropdownProps) {
  const [open, setOpen] = createSignal(false);

  // The default action for escape press is to toggle the bottom tools drawer in
  // chrome devtools. The only way to stop that is to stop event propagation
  // at the window level during the capture phase. After doing that, we also
  // need to manually close the modal or dropdown menu.
  let dropdownTrigger!: HTMLButtonElement;
  let menu!: HTMLElement;
  let clearModal!: HTMLDialogElement;
  const closeOverlay = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (menu.contains(event.target as HTMLElement)) {
        event.stopPropagation();
        setOpen(false);
      } else if (clearModal.contains(event.target as HTMLElement)) {
        event.stopPropagation();
        clearModal.close();
      }
    }
  };
  onMount(() => window.addEventListener("keydown", closeOverlay, true));
  onCleanup(() => window.removeEventListener("keydown", closeOverlay, true));

  const { clearStoreMutation, clearStore } = useIndexedDBContext();
  const { reloadTableData } = useTableReloadContext();
  return (
    <>
      <DropdownMenu open={open()} onOpenChange={setOpen}>
        <DropdownMenu.Trigger
          as={UnstyledButton}
          ref={dropdownTrigger}
          class={styles.actions}
        >
          <ThreeDotIcon />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content ref={menu} class={styles.menu}>
            <DropdownMenu.Item
              class={styles.item}
              disabled={clearStoreMutation.isLoading}
              as="button"
              command="show-modal"
              commandfor="clear-store-modal"
            >
              Clear store
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu>
      <dialog
        ref={clearModal}
        id="clear-store-modal"
        class={styles.dialog}
        onClose={() => dropdownTrigger.focus()}
      >
        <ModalHeader title="Clear Store" modalId="clear-store-modal" />
        <div>
          Are you sure you want to delete all objects stored in '
          {props.activeStore.storeName}'?
        </div>
        <ModalFooter>
          <ModalCancelButton modalId="clear-store-modal" />
          <ModalDeleteButton
            loading={clearStoreMutation.isLoading}
            onClick={() => {
              clearStore({
                requestID: generateRequestID(),
                dbName: props.activeStore.dbName,
                storeName: props.activeStore.storeName,
              }).then(() => {
                clearModal.close();
                reloadTableData();
              });
            }}
          >
            Clear
          </ModalDeleteButton>
        </ModalFooter>
      </dialog>
    </>
  );
}

interface StoreActionsDropdownProps {
  activeStore: ActiveObjectStore;
}
