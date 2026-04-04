import {
  Accessor,
  createContext,
  createSignal,
  FlowProps,
  useContext,
} from "solid-js";

const TableReloadContext = createContext<TableReloadContextType>();

export function useTableReloadContext() {
  const context = useContext(TableReloadContext);
  if (!context) {
    throw new Error("useTableReloadContext: cannot find TableReloadContext");
  }

  return context;
}

export function TableReloadContextProvider(props: FlowProps) {
  const [tableReloadTrigger, setTableReloadTrigger] = createSignal<
    number | null
  >(null);
  const reloadTableData = () => setTableReloadTrigger(Date.now());

  return (
    <TableReloadContext.Provider
      value={{ tableReloadTrigger, reloadTableData }}
    >
      {props.children}
    </TableReloadContext.Provider>
  );
}

interface TableReloadContextType {
  tableReloadTrigger: Accessor<number | null>;
  reloadTableData: () => void;
}
