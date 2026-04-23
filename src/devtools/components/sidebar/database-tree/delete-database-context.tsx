import {
  Accessor,
  createContext,
  createSignal,
  FlowProps,
  Setter,
  useContext,
} from "solid-js";

import { useDatabaseTreeContext } from "@/devtools/components/sidebar/database-tree/database-tree-context";
import DeleteDatabaseModal from "@/devtools/components/sidebar/database-tree/DeleteDatabaseModal";
import {
  createDataMutation,
  Mutation,
} from "@/devtools/utils/create-data-mutation";
import { isDataMutationSuccessful } from "@/devtools/utils/inspected-window-data-mutation";
import { triggerDatabaseDelete } from "@/devtools/utils/inspected-window-database-delete";
import { DatabaseDeleteRequest } from "@/devtools/utils/types";

const DeleteDatabaseContext = createContext<DeleteDatabaseContextType>();

export function DeleteDatabaseContextProvider(props: FlowProps) {
  const { focusItem } = useDatabaseTreeContext();

  const [dbToDelete, setDBToDelete] = createSignal<number | null>(null);

  // place the delete-database mutation in this provider to allow a single delete
  // request at any time.
  const { mutation: deleteDBMutation, mutate: deleteDB } = createDataMutation(
    async (request: DatabaseDeleteRequest) => {
      await triggerDatabaseDelete(request);
      await isDataMutationSuccessful(
        "__indexeddb_browser_database_delete",
        request.requestID,
        5_000,
      );
    },
  );

  return (
    <DeleteDatabaseContext.Provider
      value={{
        dbToDelete,
        setDBToDelete,
        deleteDBMutation,
        deleteDB,
      }}
    >
      {props.children}
      <DeleteDatabaseModal
        onClose={() => {
          const dbPos = dbToDelete();
          if (dbPos !== null) {
            focusItem(dbPos);
            setDBToDelete(null);
          }
        }}
      />
    </DeleteDatabaseContext.Provider>
  );
}

export function useDeleteDatabaseContext() {
  const context = useContext(DeleteDatabaseContext);
  if (!context) {
    throw new Error(
      "useDeleteDatabaseContext: Cannot find DeleteDatabaseContext",
    );
  }

  return context;
}

interface DeleteDatabaseContextType {
  dbToDelete: Accessor<number | null>;
  setDBToDelete: Setter<number | null>;
  deleteDBMutation: Mutation;
  deleteDB: (params: DatabaseDeleteRequest) => Promise<void>;
}
