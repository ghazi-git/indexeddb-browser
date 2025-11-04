import { createContext, FlowProps, useContext } from "solid-js";
import { createStore } from "solid-js/store";

const TableEditContext = createContext<TableEditContextType>();

export function useTableEditContext() {
  const context = useContext(TableEditContext);
  if (!context) {
    throw new Error("useTableEditContext: cannot find TableEditContext");
  }

  return context;
}

export function TableEditContextProvider(props: FlowProps) {
  const [tableEditStore, setTableEditStore] = createStore<TableEditStore>({
    errorMsg: null,
  });
  const setErrorMsg = (msg: string | null) =>
    setTableEditStore("errorMsg", msg);

  return (
    <TableEditContext.Provider value={{ tableEditStore, setErrorMsg }}>
      {props.children}
    </TableEditContext.Provider>
  );
}

interface TableEditContextType {
  tableEditStore: TableEditStore;
  setErrorMsg: (msg: string | null) => void;
}

interface TableEditStore {
  errorMsg: string | null;
}
