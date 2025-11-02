import { For, Show } from "solid-js";

import CheckboxCell from "@/devtools/components/main-content/object-store-view/CheckboxCell";
import ColumnDatatypeSelect from "@/devtools/components/main-content/object-store-view/ColumnDatatypeSelect";
import ColumnsDatatypeNotes from "@/devtools/components/main-content/object-store-view/ColumnsDatatypeNotes";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import SingleLineText from "@/devtools/components/SingleLineText";
import KeyIcon from "@/devtools/components/svg-icons/KeyIcon";
import { TableColumn, TableColumnDatatype } from "@/devtools/utils/types";

import styles from "./ColumnsConfig.module.css";

export default function ColumnsConfig() {
  const { query } = useTableContext();
  const columns = () => query.data?.columns;

  return (
    <div class={styles["columns-config"]}>
      <table>
        <thead>
          <tr>
            <th>Column</th>
            <th>Visible</th>
            <th>Datatype</th>
          </tr>
        </thead>
        <tbody>
          <Show
            when={columns()}
            fallback={
              <tr>
                <td colspan="3">Nothing to show</td>
              </tr>
            }
          >
            {(cols) => (
              <For each={cols()}>
                {(column) => <ColumnConfig column={column} />}
              </For>
            )}
          </Show>
        </tbody>
      </table>
      <ColumnsDatatypeNotes />
    </div>
  );
}

function ColumnConfig(props: { column: TableColumn }) {
  const { setColumnVisibility, setColumnDatatype } = useTableContext();

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
      <td>
        <ColumnDatatypeSelect
          value={props.column.datatype}
          onChange={(event) => {
            const datatype = event.target.value as TableColumnDatatype;
            setColumnDatatype(props.column.name, datatype);
          }}
        />
      </td>
    </tr>
  );
}
