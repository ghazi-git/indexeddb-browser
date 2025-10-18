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
  EMPTY_VALUE,
} from "@/devtools/components/main-content/breadcrumbs/BreadcrumbSelect";
import ReloadStore from "@/devtools/components/main-content/breadcrumbs/ReloadStore";
import AngleRightIcon from "@/devtools/components/svg-icons/AngleRightIcon";
import { IndexedDB } from "@/devtools/utils/dummy-data";

import styles from "./Breadcrumbs.module.css";

export default function Breadcrumbs(props: { databases: IndexedDB[] }) {
  const dbOptions = () => {
    return [
      { label: "Select IndexedDB", value: EMPTY_VALUE },
      ...props.databases.map((db) => ({
        label: db.name,
        value: db.name,
      })),
    ];
  };

  const [selectedDB, setSelectedDB] = createSignal<IndexedDB | undefined>();
  const [selectedStore, setSelectedStore] = createSignal<string>(EMPTY_VALUE);
  const storeOptions = () => {
    const options = [{ label: "Select Store", value: EMPTY_VALUE }];
    const db = selectedDB();
    if (db) {
      return options.concat(
        db.objectStores.map((name) => ({
          label: name,
          value: name,
        })),
      );
    } else {
      return options;
    }
  };
  onMount(() => {
    setSelectedDB(props.databases[0]);
  });

  // set the active store on selected item change
  const { activeObjectStore, setActiveObjectStore } =
    useActiveObjectStoreContext();
  createEffect(() => {
    const storeName = selectedStore();
    untrack(() => {
      const dbName = selectedDB()?.name;
      if (dbName && storeName !== EMPTY_VALUE) {
        setActiveObjectStore({ dbName, storeName });
      }
    });
  });
  // set the selected item on active store change
  createEffect(() => {
    const activeStore = activeObjectStore();
    if (activeStore) {
      const { dbName, storeName } = activeStore;
      let db: IndexedDB | undefined;
      untrack(() => {
        db = props.databases.find((db) => db.name === dbName);
      });
      if (db) {
        batch(() => {
          setSelectedDB(db);
          setSelectedStore(storeName);
        });
      }
    }
  });

  return (
    <div class={styles.breadcrumbs}>
      <BreadcrumbSelect
        options={dbOptions()}
        value={selectedDB()?.name ?? EMPTY_VALUE}
        onChange={(event) => {
          const selected = props.databases.find(
            (db) => db.name === event.target.value,
          );
          batch(() => {
            setSelectedDB(selected);
            setSelectedStore(EMPTY_VALUE);
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
            options={storeOptions()}
            value={selectedStore()}
            onChange={(event) => {
              setSelectedStore(event.target.value);
            }}
          />
          <Show when={selectedStore() !== EMPTY_VALUE}>
            <ReloadStore />
          </Show>
        </Match>
      </Switch>
    </div>
  );
}
