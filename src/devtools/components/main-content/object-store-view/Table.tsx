import { createGrid, GridApi, GridOptions } from "ag-grid-community";
import { createEffect, createSignal, onMount } from "solid-js";

import { useTableSearchContext } from "@/devtools/components/main-content/object-store-view/table-search-context";
import { TableRow } from "@/devtools/utils/create-table-query";

import styles from "./Table.module.css";

export default function Table(props: { gridOptions: GridOptions<TableRow> }) {
  const theme = createThemeSignal();
  let gridApi: GridApi;
  let tableContainer: HTMLDivElement;
  onMount(() => {
    gridApi = createGrid(tableContainer, props.gridOptions);
  });

  const { searchTerm } = useTableSearchContext();
  createEffect(() => {
    gridApi.setGridOption("quickFilterText", searchTerm());
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
