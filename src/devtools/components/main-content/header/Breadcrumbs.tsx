import {
  batch,
  createEffect,
  createSignal,
  Match,
  onMount,
  Show,
  Switch,
  untrack,
} from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import BreadcrumbSelect, {
  BreadcrumbSelectOption,
} from "@/devtools/components/main-content/header/BreadcrumbSelect";
import ReloadStore from "@/devtools/components/main-content/header/ReloadStore";
import AngleRightIcon from "@/devtools/components/svg-icons/AngleRightIcon";
import { IndexedDB } from "@/devtools/utils/types";

import styles from "./Breadcrumbs.module.css";

export default function Breadcrumbs(props: { databases: IndexedDB[] }) {
  const [selectedDB, setSelectedDB] = createSignal<IndexedDB | null>(null);
  const dbOptions = () => {
    return [
      { label: "Select IndexedDB", value: "" },
      ...props.databases.map((db) => ({
        label: db.name,
        value: db.name,
      })),
    ];
  };

  const [selectedStore, setSelectedStore] = createSignal<StoreOrIndex | null>(
    null,
  );
  const storeOptions = () => {
    const options: BreadcrumbSelectOption[] = [
      { label: "Select Store or Index", value: "" },
    ];
    const db = selectedDB();
    if (db) {
      db.objectStores.forEach((store) => {
        const storeName = store.name;
        options.push({
          label: store.name,
          value: serializeStoreOrIndex({ storeName, indexName: null }),
        });
        const indexOptions: BreadcrumbSelectOption[] = store.indexNames.map(
          (indexName) => ({
            label: indexName,
            value: serializeStoreOrIndex({ storeName, indexName }),
            subItem: true,
          }),
        );
        options.push(...indexOptions);
      });
    }
    return options;
  };
  onMount(() => {
    setSelectedDB(props.databases[0]);
  });

  // set the active store on selected item change
  const { activeObjectStore, setActiveObjectStore } =
    useActiveObjectStoreContext();
  createEffect(() => {
    const selected = selectedStore();
    const db = untrack(() => selectedDB());
    if (db && selected) {
      setActiveObjectStore({
        dbName: db.name,
        storeName: selected.storeName,
        indexName: selected.indexName,
      });
    }
  });
  // set the selected item on active store change
  createEffect(() => {
    const activeStore = activeObjectStore();
    if (activeStore) {
      const { dbName, storeName, indexName } = activeStore;
      const db = untrack(() => {
        return props.databases.find((db) => db.name === dbName);
      });
      if (db) {
        batch(() => {
          setSelectedDB(db);
          setSelectedStore({ storeName, indexName });
        });
      }
    }
  });

  return (
    <div class={styles.breadcrumbs}>
      <BreadcrumbSelect
        id="db-selector"
        aria-label="IndexedDB Selector"
        options={dbOptions()}
        value={selectedDB()?.name ?? ""}
        onChange={(event) => {
          const selected = props.databases.find(
            (db) => db.name === event.target.value,
          );
          batch(() => {
            setSelectedDB(selected ?? null);
            setSelectedStore(null);
          });
        }}
      />
      <Switch>
        <Match when={selectedDB()?.objectStores.length === 0}>
          <div class={styles["angle-right-icon"]}>
            <AngleRightIcon />
          </div>
          <div class={styles["no-stores"]}>No stores found</div>
        </Match>
        <Match when={selectedDB()?.objectStores.length}>
          <div class={styles["angle-right-icon"]}>
            <AngleRightIcon />
          </div>
          <BreadcrumbSelect
            id="store-selector"
            aria-label="Object Store or Index Selector"
            options={storeOptions()}
            value={serializeStoreOrIndex(selectedStore())}
            onChange={(event) => {
              const selected = parseStoreOrIndex(event.target.value);
              setSelectedStore(selected);
            }}
          />
          <Show when={!selectedStore()}>
            <ReloadStore />
          </Show>
        </Match>
      </Switch>
    </div>
  );
}

function serializeStoreOrIndex(value: StoreOrIndex | null) {
  if (value === null) return "";

  return JSON.stringify(value);
}

function parseStoreOrIndex(value: string): StoreOrIndex | null {
  try {
    const parsed = JSON.parse(value);
    const { storeName, indexName } = parsed;
    if (
      typeof storeName === "string" &&
      (typeof indexName === "string" || indexName === null)
    ) {
      return { storeName, indexName };
    }
  } catch {}
  return null;
}

interface StoreOrIndex {
  storeName: string;
  indexName: string | null;
}
