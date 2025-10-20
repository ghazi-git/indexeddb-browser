import { For, Show } from "solid-js";

import CheckboxCell from "@/devtools/components/main-content/object-store-view/CheckboxCell";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import SingleLineText from "@/devtools/components/SingleLineText";
import KeyIcon from "@/devtools/components/svg-icons/KeyIcon";
import { TableColumn, TableData } from "@/devtools/utils/create-table-query";

import styles from "./ColumnsConfig.module.css";

export default function ColumnsConfig(props: { tableData: TableData }) {
  return (
    <Show
      when={props.tableData.canDisplay}
      fallback={
        <div>
          This object store has no keypath. This <i>usually</i> means that it
          has data not suitable for display in a table. Use the native IndexedDB
          viewer instead.
        </div>
      }
    >
      <table class={styles["columns-config"]}>
        <thead>
          <tr>
            <th>Column</th>
            <th>Visible</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.tableData.columns}>
            {(column) => <ColumnConfig column={column} />}
          </For>
        </tbody>
      </table>
    </Show>
  );
}

function ColumnConfig(props: { column: TableColumn }) {
  const { setColumnVisibility, setColumnAsTimestamp } = useTableContext();

  return (
    <tr>
      <td>
        <div class={styles.column}>
          <Show when={props.column.isKey}>
            <div class={styles["key-icon"]} title="Key column">
              <KeyIcon />
            </div>
          </Show>
          <SingleLineText
            text={props.column.name}
            class={styles["column-name"]}
          />
        </div>
      </td>
      <CheckboxCell
        checked={props.column.isVisible}
        onChange={(event) => {
          setColumnVisibility(props.column.name, event.target.checked);
        }}
      />
      <CheckboxCell
        checked={props.column.isTimestamp}
        onChange={(event) => {
          setColumnAsTimestamp(props.column.name, event.target.checked);
        }}
      />
    </tr>
  );
}
