import { createContext, createEffect, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import {
  createDataMutation,
  Mutation,
} from "@/devtools/utils/create-data-mutation";
import { triggerColumnUpdate } from "@/devtools/utils/inspected-window-column-update";
import { triggerDataDeletion } from "@/devtools/utils/inspected-window-data-delete";
import { isDataMutationSuccessful } from "@/devtools/utils/inspected-window-data-mutation";
import { triggerDataSaveInLineKey } from "@/devtools/utils/inspected-window-data-save-in-line-key";
import { triggerDataSaveOutOfLineKey } from "@/devtools/utils/inspected-window-data-save-out-of-line-key";
import {
  ColumnUpdateRequest,
  DataDeletionRequest,
  DataSaveInLineKeyRequest,
  DataSaveOutOfLineKeyRequest,
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

  const { mutation: updateColumnOperation, mutate: updateColumn } =
    createDataMutation<ColumnUpdateRequest>(async (request) => {
      await triggerColumnUpdate(request);
      await isDataMutationSuccessful(
        "__indexeddb_browser_column_update",
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
  const {
    mutation: saveDataWithOutOfLineKeysOperation,
    mutate: saveDataWithOutOfLineKeys,
  } = createDataMutation<DataSaveOutOfLineKeyRequest>(async (request) => {
    await triggerDataSaveOutOfLineKey(request);
    await isDataMutationSuccessful(
      "__indexeddb_browser_data_save_out_of_line_key",
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
        updateColumnOperation,
        updateColumn,
        deleteOperation,
        deleteData,
        resetDeleteOperation,
        saveDataWithInLineKeysOperation,
        saveDataWithInLineKeys,
        saveDataWithOutOfLineKeysOperation,
        saveDataWithOutOfLineKeys,
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
  updateColumnOperation: Mutation;
  updateColumn: (params: ColumnUpdateRequest) => Promise<void>;
  deleteOperation: Mutation;
  deleteData: (params: DataDeletionRequest) => Promise<void>;
  resetDeleteOperation: () => void;
  saveDataWithInLineKeysOperation: Mutation;
  saveDataWithInLineKeys: (params: DataSaveInLineKeyRequest) => Promise<void>;
  saveDataWithOutOfLineKeysOperation: Mutation;
  saveDataWithOutOfLineKeys: (
    params: DataSaveOutOfLineKeyRequest,
  ) => Promise<void>;
}

interface TableMutationStore {
  errorMsg: string | null;
  selectedObjects: TableRow[];
}
