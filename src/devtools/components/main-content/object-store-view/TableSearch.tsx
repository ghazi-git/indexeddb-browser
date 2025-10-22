import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";

import styles from "./TableSearch.module.css";

export default function TableSearch() {
  const { activeObjectStore } = useActiveObjectStoreContext();
  const { settings, setSearchTerm } = useTableSettingsContext();
  return (
    <input
      class={styles.input}
      type="text"
      placeholder={`Search ${activeObjectStore()?.storeName ?? ""}`}
      value={settings.searchTerm}
      onInput={(event) => {
        setSearchTerm(event.target.value);
      }}
    />
  );
}
