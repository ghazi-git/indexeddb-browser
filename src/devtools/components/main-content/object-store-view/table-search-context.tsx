import {
  Accessor,
  createContext,
  createSignal,
  FlowProps,
  Setter,
  useContext,
} from "solid-js";

const TableSearchContext = createContext<TableSearchContextType>();

export function useTableSearchContext() {
  const context = useContext(TableSearchContext);
  if (!context) {
    throw new Error("useTableSearchContext: cannot find TableSearchContext");
  }

  return context;
}

export function TableSearchContextProvider(props: FlowProps) {
  const [searchTerm, setSearchTerm] = createSignal("");
  return (
    <TableSearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {props.children}
    </TableSearchContext.Provider>
  );
}

interface TableSearchContextType {
  searchTerm: Accessor<string>;
  setSearchTerm: Setter<string>;
}
