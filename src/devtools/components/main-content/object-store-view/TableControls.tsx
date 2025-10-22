import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";
import TableSettingsButton from "@/devtools/components/main-content/object-store-view/TableSettingsButton";

import styles from "./TableControls.module.css";

export default function TableControls() {
  const { activeObjectStore } = useActiveObjectStoreContext();
  const { settings, setSearchTerm } = useTableSettingsContext();

  return (
    <div class={styles.controls}>
      <input
        type="text"
        placeholder={`Search ${activeObjectStore()?.storeName ?? ""}`}
        value={settings.searchTerm}
        onInput={(event) => {
          setSearchTerm(event.target.value);
        }}
      />
      <TableSettingsButton />
    </div>
  );
}
