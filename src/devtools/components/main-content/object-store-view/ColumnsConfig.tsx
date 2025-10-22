import { For, Show } from "solid-js";

import CheckboxCell from "@/devtools/components/main-content/object-store-view/CheckboxCell";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import SingleLineText from "@/devtools/components/SingleLineText";
import KeyIcon from "@/devtools/components/svg-icons/KeyIcon";
import { TableColumn } from "@/devtools/utils/create-table-query";

import styles from "./ColumnsConfig.module.css";

export default function ColumnsConfig() {
  const { query } = useTableContext();
  const columns = () => query.data!.columns as TableColumn[];

  return (
    <>
      <table class={styles["columns-config"]}>
        <thead>
          <tr>
            <th>Column</th>
            <th>Visible</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <For each={columns()}>
            {(column) => <ColumnConfig column={column} />}
          </For>
        </tbody>
      </table>
      <small class={styles.hint}>
        * Any column value formatted as datetime is in UTC
      </small>
    </>
  );
}

function ColumnConfig(props: { column: TableColumn }) {
  const { setColumnVisibility, setColumnAsTimestamp } = useTableContext();

  return (
    <tr>
      <td>
        <div class={styles.column}>
          <SingleLineText
            text={props.column.name}
            class={styles["column-name"]}
          />
          <Show when={props.column.isKey}>
            <div class={styles["key-icon"]} title="Key column">
              <KeyIcon />
            </div>
          </Show>
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
