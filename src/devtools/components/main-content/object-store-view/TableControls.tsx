import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import { useTableSearchContext } from "@/devtools/components/main-content/object-store-view/table-search-context";
import TableSettingsButton from "@/devtools/components/main-content/object-store-view/TableSettingsButton";

import styles from "./TableControls.module.css";

export default function TableControls() {
  const { activeObjectStore } = useActiveObjectStoreContext();
  const { searchTerm, setSearchTerm } = useTableSearchContext();

  return (
    <div class={styles.controls}>
      <input
        type="text"
        placeholder={`Search ${activeObjectStore()?.storeName ?? ""}`}
        value={searchTerm()}
        onInput={(event) => {
          setSearchTerm(event.target.value);
        }}
      />
      <TableSettingsButton />
    </div>
  );
}
