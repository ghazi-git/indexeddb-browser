import {
  createContext,
  createEffect,
  FlowProps,
  untrack,
  useContext,
} from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import {
  createTableDataQuery,
  Query,
} from "@/devtools/utils/create-table-query";

const TableContext = createContext<TableContextType>();

export function useTableContext() {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("useTableContext: cannot find TableContext");
  }

  return context;
}

export function TableContextProvider(props: FlowProps) {
  const { activeObjectStore } = useActiveObjectStoreContext();
  const { query, fetchTableData } = createTableDataQuery();
  const loadTableData = () => {
    const activeStore = activeObjectStore();
    if (activeStore) {
      untrack(() => {
        fetchTableData(activeStore);
      });
    }
  };
  // get the obj store data when activeObjectStore is updated
  createEffect(() => loadTableData());

  return (
    <TableContext.Provider value={{ query, refetch: loadTableData }}>
      {props.children}
    </TableContext.Provider>
  );
}

interface TableContextType {
  query: Query;
  refetch: () => void;
}
