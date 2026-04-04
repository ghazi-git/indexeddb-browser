import {
  createContext,
  createEffect,
  createResource,
  createSignal,
  FlowProps,
  Resource,
  useContext,
} from "solid-js";

import { useOriginContext } from "@/devtools/components/origin-context";
import {
  createDataMutation,
  Mutation,
} from "@/devtools/utils/create-data-mutation";
import { isDataMutationSuccessful } from "@/devtools/utils/inspected-window-data-mutation";
import { triggerIndexedDBsFetching } from "@/devtools/utils/inspected-window-databases";
import { fetchIndexedDBs } from "@/devtools/utils/inspected-window-databases-polling";
import { generateRequestID } from "@/devtools/utils/inspected-window-helpers";
import { triggerStoreClear } from "@/devtools/utils/inspected-window-store-clear";
import { IndexedDB, StoreClearRequest } from "@/devtools/utils/types";

const IndexedDBContext = createContext<IndexedDBContextType>();

export function useIndexedDBContext() {
  const context = useContext(IndexedDBContext);
  if (!context) {
    throw new Error("useIndexedDBContext: cannot find IndexedDBContext");
  }

  return context;
}

export function IndexedDBContextProvider(props: FlowProps) {
  // the request is disabled by default. It is triggered once we know the
  // origin in the createEffect below
  const [requestID, setRequestID] = createSignal<string | undefined>();
  const [data] = createResource(requestID, (requestID) => {
    return new Promise<IndexedDB[]>(async (resolve, reject) => {
      try {
        await triggerIndexedDBsFetching(requestID);
        const indexedDBs = await fetchIndexedDBs(requestID);
        // sort the DBs and their stores alphabetically
        const collator = new Intl.Collator(undefined, { sensitivity: "base" });
        const dbs = indexedDBs
          .map((db) => ({
            name: db.name,
            objectStores: db.objectStores.toSorted(collator.compare),
          }))
          .toSorted((db1, db2) => collator.compare(db1.name, db2.name));
        resolve(dbs);
      } catch (e) {
        reject(e);
      }
    });
  });

  const refetchIndexedDBs = () => {
    setRequestID(generateRequestID());
  };

  // when the inspected window origin changes update the indexedDB list
  const { origin } = useOriginContext();
  createEffect(() => {
    if (origin()) {
      refetchIndexedDBs();
    }
  });

  // place the clear-store mutation at the top level to allow a single clear
  // request at any time.
  const { mutation: clearStoreMutation, mutate: clearStore } =
    createDataMutation(async (request: StoreClearRequest) => {
      await triggerStoreClear(request);
      await isDataMutationSuccessful(
        "__indexeddb_browser_store_clear",
        request.requestID,
        15_000,
      );
    });

  return (
    <IndexedDBContext.Provider
      value={{
        databases: data,
        refetchIndexedDBs,
        clearStoreMutation,
        clearStore,
      }}
    >
      {props.children}
    </IndexedDBContext.Provider>
  );
}

interface IndexedDBContextType {
  databases: Resource<IndexedDB[]>;
  refetchIndexedDBs: () => void;
  clearStoreMutation: Mutation;
  clearStore: (params: StoreClearRequest) => Promise<void>;
}
