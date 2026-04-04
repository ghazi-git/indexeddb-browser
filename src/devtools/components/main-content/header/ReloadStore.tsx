import { Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import LoadingIcon from "@/devtools/components/svg-icons/LoadingIcon";
import ReloadIcon from "@/devtools/components/svg-icons/ReloadIcon";
import { useTableReloadContext } from "@/devtools/components/table-reload-context";

import styles from "./ReloadStore.module.css";

export default function ReloadStore() {
  const { query } = useTableContext();
  const { reloadTableData } = useTableReloadContext();
  return (
    <UnstyledButton
      class={styles.reload}
      title={query.isLoading ? "Reloading data..." : "Reload store data"}
      disabled={query.isLoading}
      onClick={() => {
        reloadTableData();
      }}
    >
      <Show when={!query.isLoading} fallback={<LoadingIcon />}>
        <ReloadIcon />
      </Show>
    </UnstyledButton>
  );
}
