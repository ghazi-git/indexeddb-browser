import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings/context";

import styles from "./ObjectsCountSetting.module.css";

export default function ObjectsCountSetting() {
  const { refetch } = useTableContext();
  const { settings, setObjectsCount } = useTableSettingsContext();

  return (
    <div class={styles["objects-count"]}>
      <label for="objects-count">Number of objects to fetch</label>
      <input
        type="number"
        step="1"
        min="0"
        id="objects-count"
        value={settings.objectsCount ?? undefined}
        onChange={(event) => {
          const val = parseInt(event.target.value) || null;
          if (val === null || val >= 0) {
            setObjectsCount(parseInt(event.target.value) || null);
            refetch();
          } else {
            event.target.value =
              typeof settings.objectsCount === "number"
                ? String(settings.objectsCount)
                : "";
          }
        }}
      />
      <small>Leave empty to get all objects</small>
    </div>
  );
}
