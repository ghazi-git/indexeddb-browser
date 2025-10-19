import { ActiveObjectStore } from "@/devtools/components/active-object-store-context";
import ColumnsButton from "@/devtools/components/main-content/object-store-view/ColumnsButton";
import { useTableSearchContext } from "@/devtools/components/main-content/object-store-view/table-search-context";

import styles from "./TableControls.module.css";

export default function TableControls(props: {
  activeStore: ActiveObjectStore;
}) {
  const { searchTerm, setSearchTerm } = useTableSearchContext();

  return (
    <div class={styles.controls}>
      <input
        type="text"
        placeholder={`Search ${props.activeStore.storeName}`}
        value={searchTerm()}
        onInput={(event) => {
          setSearchTerm(event.target.value);
        }}
      />
      <ColumnsButton />
    </div>
  );
}
