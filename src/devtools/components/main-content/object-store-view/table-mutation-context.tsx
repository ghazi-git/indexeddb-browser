import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import {
  createDataMutation,
  Mutation,
} from "@/devtools/utils/create-data-mutation";
import { triggerDataDeletion } from "@/devtools/utils/inspected-window-data-delete";
import { isDataMutationSuccessful } from "@/devtools/utils/inspected-window-data-mutation";
import { triggerDataUpdate } from "@/devtools/utils/inspected-window-data-update";
import {
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
      selectedRowIDs: [],
    });
  const setErrorMsg = (msg: string | null) =>
    setTableMutationStore("errorMsg", msg);
  const setSelectedRowIDs = (selectedRowIDs: SelectedRowID[]) => {
    setTableMutationStore("selectedRowIDs", selectedRowIDs);
  };

  const { mutation: updateOperation, mutate: updateField } =
    createDataMutation<DataUpdateRequest>(async (request) => {
      await triggerDataUpdate(request);
      await isDataMutationSuccessful(
        "__indexeddb_browser_data_update",
        request.requestID,
      );
    });
  const { mutation: deleteOperation, mutate: deleteData } =
    createDataMutation<DataDeletionRequest>(async (request) => {
      await triggerDataDeletion(request);
      await isDataMutationSuccessful(
        "__indexeddb_browser_data_delete",
        request.requestID,
      );
    });

  return (
    <TableMutationContext.Provider
      value={{
        tableMutationStore,
        setErrorMsg,
        setSelectedRowIDs,
        updateOperation,
        updateField,
        deleteOperation,
        deleteData,
      }}
    >
      {props.children}
    </TableMutationContext.Provider>
  );
}

interface TableMutationContextType {
  tableMutationStore: TableMutationStore;
  setErrorMsg: (msg: string | null) => void;
  setSelectedRowIDs: (selectedRowIDs: SelectedRowID[]) => void;
  updateOperation: Mutation;
  updateField: (params: DataUpdateRequest) => Promise<void>;
  deleteOperation: Mutation;
  deleteData: (params: DataDeletionRequest) => Promise<void>;
}

interface TableMutationStore {
  errorMsg: string | null;
  selectedRowIDs: SelectedRowID[];
}

export type SelectedRowID = {
  name: string;
  datatype: TableColumnDatatype;
  value: TableColumnValue;
}[];
