import { createContext, createEffect, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import {
  createDataMutation,
  Mutation,
} from "@/devtools/utils/create-data-mutation";
import { triggerDataCreation } from "@/devtools/utils/inspected-window-data-create";
import { triggerDataDeletion } from "@/devtools/utils/inspected-window-data-delete";
import { isDataMutationSuccessful } from "@/devtools/utils/inspected-window-data-mutation";
import { triggerDataUpdate } from "@/devtools/utils/inspected-window-data-update";
import {
  DataCreationRequest,
  DataDeletionRequest,
  DataUpdateRequest,
  TableColumnDatatype,
  TableColumnValue,
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
      selectedObjectIDs: [],
    });
  const setErrorMsg = (msg: string | null) =>
    setTableMutationStore("errorMsg", msg);
  const setSelectedObjectIDs = (selectedObjectIDs: SelectedObjectID[]) => {
    setTableMutationStore("selectedObjectIDs", selectedObjectIDs);
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
    mutation: createOperation,
    mutate: createData,
    reset: resetCreateOperation,
  } = createDataMutation<DataCreationRequest>(async (request) => {
    await triggerDataCreation(request);
    await isDataMutationSuccessful(
      "__indexeddb_browser_data_create",
      request.requestID,
    );
  });

  // reset the error msg and selected objects on store change
  const { activeObjectStore } = useActiveObjectStoreContext();
  createEffect(() => {
    activeObjectStore();
    setTableMutationStore({ errorMsg: null, selectedObjectIDs: [] });
  });

  return (
    <TableMutationContext.Provider
      value={{
        tableMutationStore,
        setErrorMsg,
        setSelectedObjectIDs,
        updateOperation,
        updateField,
        deleteOperation,
        deleteData,
        resetDeleteOperation,
        createOperation,
        createData,
        resetCreateOperation,
      }}
    >
      {props.children}
    </TableMutationContext.Provider>
  );
}

interface TableMutationContextType {
  tableMutationStore: TableMutationStore;
  setErrorMsg: (msg: string | null) => void;
  setSelectedObjectIDs: (selectedObjectIDs: SelectedObjectID[]) => void;
  updateOperation: Mutation;
  updateField: (params: DataUpdateRequest) => Promise<void>;
  deleteOperation: Mutation;
  deleteData: (params: DataDeletionRequest) => Promise<void>;
  resetDeleteOperation: () => void;
  createOperation: Mutation;
  createData: (params: DataCreationRequest) => Promise<void>;
  resetCreateOperation: () => void;
}

interface TableMutationStore {
  errorMsg: string | null;
  selectedObjectIDs: SelectedObjectID[];
}

export type SelectedObjectID = {
  name: string;
  datatype: TableColumnDatatype;
  value: TableColumnValue;
}[];
