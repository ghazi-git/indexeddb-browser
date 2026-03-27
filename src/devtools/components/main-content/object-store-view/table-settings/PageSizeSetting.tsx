import { For } from "solid-js";

import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings/context";
import { PAGE_SIZES } from "@/devtools/utils/saved-settings";

import styles from "./PageSizeSetting.module.css";

export default function PageSizeSetting() {
  const { settings, setPageSize } = useTableSettingsContext();
  const options = PAGE_SIZES.map((v) => ({ label: v, value: v }));

  return (
    <div class={styles["page-size"]}>
      <label for="page-size">Page size</label>
      <select
        id="page-size"
        name="page-size"
        onChange={(event) => {
          const val = parseInt(event.target.value);
          setPageSize(val);
        }}
      >
        <For each={options}>
          {({ label, value }) => (
            <option value={value} selected={value === settings.pageSize}>
              {label}
            </option>
          )}
        </For>
      </select>
    </div>
  );
}
