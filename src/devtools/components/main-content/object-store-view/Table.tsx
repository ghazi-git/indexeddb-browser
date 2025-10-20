import { createGrid, GridOptions } from "ag-grid-community";
import { createEffect, createSignal, onMount } from "solid-js";

import { TableRow } from "@/devtools/utils/create-table-query";

import styles from "./Table.module.css";

export default function Table(props: { gridOptions: GridOptions<TableRow> }) {
  const theme = createThemeSignal();
  let tableContainer: HTMLDivElement;
  createEffect(() => {
    createGrid(tableContainer, props.gridOptions);
  });

  return (
    <div
      ref={(elt) => {
        tableContainer = elt;
      }}
      class={styles.table}
      data-ag-theme-mode={theme()}
    />
  );
}

function createThemeSignal() {
  const [theme, setTheme] = createSignal<"light" | "dark">("light");
  onMount(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", ({ matches: isDark }) => {
        const systemTheme = isDark ? "dark" : "light";
        setTheme(systemTheme);
      });
  });

  return theme;
}
