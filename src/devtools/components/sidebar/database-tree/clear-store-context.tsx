import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import ClearStoreSidebarModal from "@/devtools/components/sidebar/database-tree/ClearStoreSidebarModal";
import { useDatabaseTreeContext } from "@/devtools/components/sidebar/database-tree/database-tree-context";

const ClearStoreContext = createContext<ClearStoreContextType>();

export function ClearStoreContextProvider(props: FlowProps) {
  const { focusItem } = useDatabaseTreeContext();

  const [store, setStore] = createStore<ClearStore>({
    modalRef: null,
    trigger: null,
  });
  const registerModalRef = (elt: HTMLDialogElement) => {
    setStore("modalRef", elt);
  };
  const openModal = (dbIndex: number, storeIndex: number) => {
    setStore("trigger", { dbIndex, storeIndex });
    store.modalRef?.showModal();
  };

  return (
    <ClearStoreContext.Provider value={{ store, openModal, registerModalRef }}>
      {props.children}
      <ClearStoreSidebarModal
        onClose={() => {
          if (store.trigger) {
            focusItem(store.trigger.dbIndex, store.trigger.storeIndex);
            setStore("trigger", null);
          }
        }}
      />
    </ClearStoreContext.Provider>
  );
}

export function useClearStoreContext() {
  const context = useContext(ClearStoreContext);
  if (!context) {
    throw new Error("useClearStoreContext: Cannot find ClearStoreContext");
  }

  return context;
}

interface ClearStoreContextType {
  store: ClearStore;
  openModal: (dbIndex: number, storeIndex: number) => void;
  registerModalRef: (elt: HTMLDialogElement) => void;
}

type ClearStore =
  | {
      modalRef: HTMLDialogElement;
      trigger: { dbIndex: number; storeIndex: number } | null;
    }
  | { modalRef: null; trigger: null };
