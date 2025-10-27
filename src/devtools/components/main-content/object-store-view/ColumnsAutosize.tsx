import { For } from "solid-js";

import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";
import { AutosizeColumns } from "@/devtools/utils/types";

import styles from "./ColumnsAutosize.module.css";

export default function ColumnsAutosize() {
  const { settings, setAutosizeColumns } = useTableSettingsContext();
  const options = [
    { label: "Grid width", value: "fit-grid-width" },
    { label: "Cell contents", value: "fit-cell-contents" },
  ];

  return (
    <div class={styles["field-wrapper"]}>
      <label id="autosize-columns-label">Autosize columns to fit:</label>
      <div
        class={styles["radio-group"]}
        role="group"
        aria-labelledby="autosize-columns-label"
      >
        <For each={options}>
          {({ label, value }) => {
            return (
              <label>
                <input
                  type="radio"
                  name="autosize-columns"
                  value={value}
                  onChange={(event) => {
                    setAutosizeColumns(event.target.value as AutosizeColumns);
                  }}
                  checked={settings.autosizeColumns === value}
                />
                {label}
              </label>
            );
          }}
        </For>
      </div>
    </div>
  );
}
