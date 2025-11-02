import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";

import styles from "./TableSearch.module.css";

export default function TableSearch() {
  const { activeObjectStore } = useActiveObjectStoreContext();
  const { settings, setSearchTerm } = useTableSettingsContext();
  const debounceSearch = () => {
    let timerID: number | undefined;

    return (term: string) => {
      if (timerID !== undefined) {
        clearTimeout(timerID);
        timerID = undefined;
      }
      timerID = setTimeout(() => setSearchTerm(term), 200);
    };
  };
  const search = debounceSearch();

  return (
    <input
      id="quick-filter"
      aria-label="Table Search"
      class={styles.input}
      type="text"
      placeholder={`Search ${activeObjectStore()?.storeName ?? ""}`}
      value={settings.searchTerm}
      onInput={(event) => {
        search(event.target.value);
      }}
    />
  );
}
