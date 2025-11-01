import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";

import styles from "./RecordsCountSetting.module.css";

export default function RecordsCountSetting() {
  const { refetch } = useTableContext();
  const { settings, setRecordsCount } = useTableSettingsContext();

  return (
    <div class={styles["records-count"]}>
      <label for="records-count">Number of records to fetch</label>
      <input
        type="number"
        id="records-count"
        value={settings.recordsCount ?? undefined}
        onChange={(event) => {
          setRecordsCount(parseInt(event.target.value) || null);
          refetch();
        }}
      />
      <small>Leave empty to get all records</small>
    </div>
  );
}
