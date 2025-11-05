import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

import {
  createDataMutation,
  Mutation,
} from "@/devtools/utils/create-data-mutation";
import { isDataMutationSuccessful } from "@/devtools/utils/inspected-window-data-mutation";
import { triggerDataUpdate } from "@/devtools/utils/inspected-window-data-update";
import { DataUpdateRequest } from "@/devtools/utils/types";

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
    });
  const setErrorMsg = (msg: string | null) =>
    setTableMutationStore("errorMsg", msg);

  const { mutation: updateOperation, mutate: updateField } =
    createDataMutation<DataUpdateRequest>(async (request) => {
      await triggerDataUpdate(request);
      await isDataMutationSuccessful(
        "__indexeddb_browser_data_update",
        request.requestID,
      );
    });

  return (
    <TableMutationContext.Provider
      value={{
        tableMutationStore: tableMutationStore,
        setErrorMsg,
        updateOperation,
        updateField,
      }}
    >
      {props.children}
    </TableMutationContext.Provider>
  );
}

interface TableMutationContextType {
  tableMutationStore: TableMutationStore;
  setErrorMsg: (msg: string | null) => void;
  updateOperation: Mutation;
  updateField: (params: DataUpdateRequest) => Promise<void>;
}

interface TableMutationStore {
  errorMsg: string | null;
}
