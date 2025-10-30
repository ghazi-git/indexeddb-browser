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
import { triggerIndexedDBsFetching } from "@/devtools/utils/inspected-window-databases";
import { fetchIndexedDBs } from "@/devtools/utils/inspected-window-databases-polling";
import { IndexedDB } from "@/devtools/utils/types";

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
    return new Promise<IndexedDB[]>(async (resolve) => {
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

  return (
    <IndexedDBContext.Provider value={{ databases: data, refetchIndexedDBs }}>
      {props.children}
    </IndexedDBContext.Provider>
  );
}

function generateRequestID() {
  const uuid = crypto.randomUUID();
  return `request-${uuid.slice(0, 8)}`;
}

interface IndexedDBContextType {
  databases: Resource<IndexedDB[]>;
  refetchIndexedDBs: () => void;
}
