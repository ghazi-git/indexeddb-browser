import {
  createContext,
  createEffect,
  createResource,
  FlowProps,
  Resource,
  useContext,
} from "solid-js";

import { useOriginContext } from "@/devtools/components/origin-context";
import { getDatabases, IndexedDB } from "@/devtools/utils/dummy-data";

const IndexedDBContext = createContext<IndexedDBContextType>();

export function useIndexedDBContext() {
  const context = useContext(IndexedDBContext);
  if (!context) {
    throw new Error("useIndexedDBContext: cannot find IndexedDBContext");
  }

  return context;
}

export function IndexedDBContextProvider(props: FlowProps) {
  const [data, { refetch }] = createResource(() => {
    return new Promise<IndexedDB[]>((resolve) => {
      setTimeout(() => {
        const collator = new Intl.Collator(undefined, { sensitivity: "base" });
        const dbs: IndexedDB[] = getDatabases()
          .map((db) => ({
            name: db.name,
            version: db.version,
            objectStores: db.objectStores.toSorted(collator.compare),
          }))
          .toSorted((db1, db2) => collator.compare(db1.name, db2.name));
        resolve(dbs);
      }, 2000);
    });
  });

  const refetchIndexedDBs = () => {
    refetch();
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

interface IndexedDBContextType {
  databases: Resource<IndexedDB[]>;
  refetchIndexedDBs: () => void;
}
