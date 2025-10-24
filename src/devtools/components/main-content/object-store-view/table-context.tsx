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
  TableColumnDatatype,
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
  const { query, setQuery, fetchTableData } = createTableDataQuery();
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

  const setColumnVisibility = (columnName: string, isVisible: boolean) => {
    if (query?.data?.columns) {
      query.data.columns.forEach((column, index) => {
        if (column.name === columnName) {
          setQuery("data", "columns", index, "isVisible", isVisible);
        }
      });
    }
  };
  const setColumnDatatype = (
    columnName: string,
    datatype: TableColumnDatatype,
  ) => {
    if (query?.data?.columns) {
      const index = query.data.columns.findIndex(
        (col) => col.name === columnName,
      );
      if (index >= 0) {
        setQuery("data", "columns", index, "datatype", datatype);
      }
    }
  };
  const updateColumnOrder = (columnName: string, newIndex: number) => {
    const oldIndex = query?.data?.columns?.findIndex(
      (col) => col.name === columnName,
    );
    if (oldIndex !== undefined && oldIndex >= -1 && oldIndex != newIndex) {
      setQuery("data", "columns", (columns) => {
        const column = columns!.splice(oldIndex, 1)[0];
        return columns!.toSpliced(newIndex, 0, column);
      });
    }
  };

  return (
    <TableContext.Provider
      value={{
        query,
        refetch: loadTableData,
        setColumnVisibility,
        setColumnDatatype,
        updateColumnOrder,
      }}
    >
      {props.children}
    </TableContext.Provider>
  );
}

interface TableContextType {
  query: Query;
  refetch: () => void;
  setColumnVisibility: (columnName: string, isVisible: boolean) => void;
  setColumnDatatype: (
    columnName: string,
    datatype: TableColumnDatatype,
  ) => void;
  updateColumnOrder: (columnName: string, newIndex: number) => void;
}
