import { batch, createSignal, Match, onMount, Show, Switch } from "solid-js";

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
