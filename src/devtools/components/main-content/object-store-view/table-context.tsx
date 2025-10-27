import {
  createContext,
  createEffect,
  FlowProps,
  untrack,
  useContext,
} from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useOriginContext } from "@/devtools/components/origin-context";
import {
  createTableDataQuery,
  Query,
} from "@/devtools/utils/create-table-query";
import { saveColumnsConfig } from "@/devtools/utils/saved-settings";
import { TableColumnDatatype } from "@/devtools/utils/types";

const TableContext = createContext<TableContextType>();

export function useTableContext() {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("useTableContext: cannot find TableContext");
  }

  return context;
}

export function TableContextProvider(props: FlowProps) {
  const { origin } = useOriginContext();
  const { activeObjectStore } = useActiveObjectStoreContext();
  const { query, setQuery, fetchTableData } = createTableDataQuery();
  const loadTableData = () => {
    const activeStore = activeObjectStore();
    if (activeStore) {
      untrack(() => {
        fetchTableData({ ...activeStore, origin: origin() });
      });
    }
  };
  // get the obj store data when activeObjectStore is updated
  createEffect(() => loadTableData());

  const _saveColumnsToLocalStorage = () => {
    const currentOrigin = origin();
    const activeStore = activeObjectStore();
    if (currentOrigin && activeStore) {
      saveColumnsConfig(
        currentOrigin,
        activeStore.dbName,
        activeStore.storeName,
        query.data!.columns!,
      );
    }
  };

  const setColumnVisibility = (columnName: string, isVisible: boolean) => {
    if (query?.data?.columns) {
      const index = query.data.columns.findIndex((c) => c.name === columnName);
      if (index >= 0) {
        setQuery("data", "columns", index, "isVisible", isVisible);
        _saveColumnsToLocalStorage();
      }
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
        _saveColumnsToLocalStorage();
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
      _saveColumnsToLocalStorage();
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
