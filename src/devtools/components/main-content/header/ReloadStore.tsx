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
  const label = () => (query.isLoading ? "Reloading data..." : "Reload data");

  return (
    <UnstyledButton
      class={styles.reload}
      title={label()}
      aria-label={label()}
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
