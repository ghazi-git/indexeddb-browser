import {
  createContext,
  createEffect,
  FlowProps,
  untrack,
  useContext,
} from "solid-js";
import { unwrap } from "solid-js/store";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useOriginContext } from "@/devtools/components/origin-context";
import {
  createTableDataQuery,
  Query,
} from "@/devtools/utils/create-table-query";
import { generateRequestID } from "@/devtools/utils/inspected-window-helpers";
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
        fetchTableData({
          ...activeStore,
          origin: origin(),
          requestID: generateRequestID(),
        });
      });
    }
  };
  // get the obj store data when activeObjectStore is updated
  createEffect(() => loadTableData());

  const _saveColumnsToLocalStorage = (
    colIndex?: number,
    newDatatype?: TableColumnDatatype,
  ) => {
    const currentOrigin = origin();
    const activeStore = activeObjectStore();
    if (currentOrigin && activeStore) {
      const columns = unwrap(query.data!.columns!);
      if (colIndex !== undefined && newDatatype) {
        columns[colIndex].datatype = newDatatype;
      }
      saveColumnsConfig(
        currentOrigin,
        activeStore.dbName,
        activeStore.storeName,
        columns,
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
        let getDataFromSource = false;
        setQuery("data", "columns", index, "datatype", (prevDatatype) => {
          getDataFromSource =
            DATATYPES_FORCING_RELOAD.includes(prevDatatype) ||
            DATATYPES_FORCING_RELOAD.includes(datatype);
          // no need to update the datatype when we're going to reload
          // the whole table in few moments
          return getDataFromSource ? prevDatatype : datatype;
        });
        if (getDataFromSource) {
          // when reloading the table, there is no change in datatype, but we
          // still want the new datatype to be saved to local storage so we
          // can convert the data to that type the next time we reload the table
          _saveColumnsToLocalStorage(index, datatype);
          loadTableData();
        } else {
          _saveColumnsToLocalStorage();
        }
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

// list of datatypes whose data we manipulate in the inspected window before
// passing it to the extension (make date and bigint json-serializable while
// setting to undefined the data of unsupported datatypes)
const DATATYPES_FORCING_RELOAD: TableColumnDatatype[] = [
  "date",
  "bigint",
  "unsupported",
];

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
