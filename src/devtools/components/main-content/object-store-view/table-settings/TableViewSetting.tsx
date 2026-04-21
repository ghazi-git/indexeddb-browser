import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings/context";
import { useTableReloadContext } from "@/devtools/components/table-reload-context";

import styles from "./TableViewSetting.module.css";

export default function TableViewSetting() {
  const { settings, toggleTryTableView } = useTableSettingsContext();
  const { reloadTableData } = useTableReloadContext();

  return (
    <label class={styles.checkbox}>
      <input
        id="try-table-view"
        type="checkbox"
        checked={settings.tryTableView}
        onChange={(event) => {
          toggleTryTableView(event.target.checked);
          reloadTableData();
        }}
      />
      For object stores with out-of-line keys, display (if possible) each object
      property in a separate column
    </label>
  );
}
