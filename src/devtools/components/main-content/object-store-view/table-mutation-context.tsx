import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

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

  return (
    <TableMutationContext.Provider
      value={{ tableMutationStore: tableMutationStore, setErrorMsg }}
    >
      {props.children}
    </TableMutationContext.Provider>
  );
}

interface TableMutationContextType {
  tableMutationStore: TableMutationStore;
  setErrorMsg: (msg: string | null) => void;
}

interface TableMutationStore {
  errorMsg: string | null;
}
