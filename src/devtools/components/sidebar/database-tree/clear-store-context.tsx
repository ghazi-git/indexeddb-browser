import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import ClearStoreSidebarModal from "@/devtools/components/sidebar/database-tree/ClearStoreSidebarModal";
import { useDatabaseTreeContext } from "@/devtools/components/sidebar/database-tree/database-tree-context";
import {
  createDataMutation,
  Mutation,
} from "@/devtools/utils/create-data-mutation";
import { isDataMutationSuccessful } from "@/devtools/utils/inspected-window-data-mutation";
import { triggerStoreClear } from "@/devtools/utils/inspected-window-store-clear";
import { StoreClearRequest } from "@/devtools/utils/types";

const ClearStoreContext = createContext<ClearStoreContextType>();

export function ClearStoreContextProvider(props: FlowProps) {
  const { focusItem } = useDatabaseTreeContext();

  const [store, setStore] = createStore<ClearStore>({
    dbPos: null,
    storePos: null,
  });
  const setStoreToBeCleared = (dbPos: number, storePos: number) => {
    setStore({ dbPos, storePos });
  };

  // place the clear-store mutation in this provider to allow a single clear
  // request at any time.
  const { mutation: clearStoreMutation, mutate: clearStore } =
    createDataMutation(async (request: StoreClearRequest) => {
      await triggerStoreClear(request);
      await isDataMutationSuccessful(
        "__indexeddb_browser_store_clear",
        request.requestID,
        15_000,
      );
    });

  return (
    <ClearStoreContext.Provider
      value={{
        store,
        setStoreToBeCleared,
        clearStoreMutation,
        clearStore,
      }}
    >
      {props.children}
      <ClearStoreSidebarModal
        onClose={() => {
          if (store.storePos !== null) {
            focusItem(store.dbPos, store.storePos);
            setStore({ dbPos: null, storePos: null });
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
  setStoreToBeCleared: (dbPos: number, storePos: number) => void;
  clearStoreMutation: Mutation;
  clearStore: (params: StoreClearRequest) => Promise<void>;
}

type ClearStore =
  | { dbPos: number; storePos: number }
  | { dbPos: null; storePos: null };
