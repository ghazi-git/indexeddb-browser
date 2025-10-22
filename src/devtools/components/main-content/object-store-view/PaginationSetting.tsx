import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";

import styles from "./PaginationSetting.module.css";

export default function PaginationSetting() {
  const { settings, togglePagination } = useTableSettingsContext();

  return (
    <label class={styles.pagination}>
      <input
        type="checkbox"
        checked={settings.pagination}
        onChange={(event) => {
          togglePagination(event.target.checked);
        }}
      />
      Enable table pagination
    </label>
  );
}
