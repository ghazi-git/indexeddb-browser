import { createUniqueId, For, JSX } from "solid-js";

import { TableColumnDatatype } from "@/devtools/utils/create-table-query";

import styles from "./ColumnDatatypeSelect.module.css";

export default function ColumnDatatypeSelect(props: ColumnDatatypeProps) {
  const options: { label: string; value: TableColumnDatatype }[] = [
    { label: "String", value: "string" },
    { label: "Number", value: "number" },
    { label: "BigInt", value: "bigint" },
    { label: "Boolean", value: "boolean" },
    { label: "Timestamp", value: "timestamp" },
    { label: "Date", value: "date" },
    { label: "Raw Data", value: "raw_data" },
  ];
  const id = createUniqueId();

  return (
    <select id={id} class={styles.datatype} aria-label="Datatype Selector">
      <For each={options}>
        {({ label, value }) => (
          <option value={value} selected={value === props.value}>
            {label}
          </option>
        )}
      </For>
    </select>
  );
}

interface ColumnDatatypeProps {
  value: TableColumnDatatype;
  onChange: JSX.ChangeEventHandler<HTMLSelectElement, Event>;
}
