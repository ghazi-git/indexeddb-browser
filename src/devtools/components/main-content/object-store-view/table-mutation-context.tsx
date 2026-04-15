import { createContext, createEffect, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import {
  createDataMutation,
  Mutation,
} from "@/devtools/utils/create-data-mutation";
import { triggerDataDeletion } from "@/devtools/utils/inspected-window-data-delete";
import { isDataMutationSuccessful } from "@/devtools/utils/inspected-window-data-mutation";
import { triggerDataSaveInLineKey } from "@/devtools/utils/inspected-window-data-save-in-line-key";
import { triggerDataUpdate } from "@/devtools/utils/inspected-window-data-update";
import {
  DataDeletionRequest,
  DataSaveInLineKeyRequest,
  DataUpdateRequest,
  TableRow,
} from "@/devtools/utils/types";

const TableMutationContext = createContext<TableMutationContextType>();

export function useTableMutationContext() {
  const context = useContext(TableMutationContext);
  if (!context) {
    throw new Error(
      "useTableMutationContext: cannot find TableMutationContext",
    );
  }

  return context;
}

export function TableMutationContextProvider(props: FlowProps) {
  const [tableMutationStore, setTableMutationStore] =
    createStore<TableMutationStore>({
      errorMsg: null,
      selectedObjects: [],
    });
  const setErrorMsg = (msg: string | null) =>
    setTableMutationStore("errorMsg", msg);
  const setSelectedObjects = (selectedObjects: TableRow[]) => {
    setTableMutationStore("selectedObjects", selectedObjects);
  };

  const { mutation: updateOperation, mutate: updateField } =
    createDataMutation<DataUpdateRequest>(async (request) => {
      await triggerDataUpdate(request);
      await isDataMutationSuccessful(
        "__indexeddb_browser_data_update",
        request.requestID,
      );
    });
  const {
    mutation: deleteOperation,
    mutate: deleteData,
    reset: resetDeleteOperation,
  } = createDataMutation<DataDeletionRequest>(async (request) => {
    await triggerDataDeletion(request);
    await isDataMutationSuccessful(
      "__indexeddb_browser_data_delete",
      request.requestID,
    );
  });
  const {
    mutation: saveDataWithInLineKeysOperation,
    mutate: saveDataWithInLineKeys,
  } = createDataMutation<DataSaveInLineKeyRequest>(async (request) => {
    await triggerDataSaveInLineKey(request);
    await isDataMutationSuccessful(
      "__indexeddb_browser_data_save_in_line_key",
      request.requestID,
    );
  });

  // reset the error msg and selected objects on store change
  const { activeObjectStore } = useActiveObjectStoreContext();
  createEffect(() => {
    activeObjectStore();
    setTableMutationStore({ errorMsg: null, selectedObjects: [] });
  });

  return (
    <TableMutationContext.Provider
      value={{
        tableMutationStore,
        setErrorMsg,
        setSelectedObjects,
        updateOperation,
        updateField,
        deleteOperation,
        deleteData,
        resetDeleteOperation,
        saveDataWithInLineKeysOperation,
        saveDataWithInLineKeys,
      }}
    >
      {props.children}
    </TableMutationContext.Provider>
  );
}

interface TableMutationContextType {
  tableMutationStore: TableMutationStore;
  setErrorMsg: (msg: string | null) => void;
  setSelectedObjects: (selectedObjects: TableRow[]) => void;
  updateOperation: Mutation;
  updateField: (params: DataUpdateRequest) => Promise<void>;
  deleteOperation: Mutation;
  deleteData: (params: DataDeletionRequest) => Promise<void>;
  resetDeleteOperation: () => void;
  saveDataWithInLineKeysOperation: Mutation;
  saveDataWithInLineKeys: (params: DataSaveInLineKeyRequest) => Promise<void>;
}

interface TableMutationStore {
  errorMsg: string | null;
  selectedObjects: TableRow[];
}
