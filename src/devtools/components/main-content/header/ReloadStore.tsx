import { Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import RefreshIcon from "@/devtools/components/svg-icons/RefreshIcon";

import styles from "./ReloadStore.module.css";

export default function ReloadStore() {
  const { query, refetch } = useTableContext();
  return (
    <UnstyledButton
      class={styles.reload}
      title={query.isLoading ? "Reloading data..." : "Reload store data"}
      loading={query.isLoading}
      onClick={() => {
        refetch();
      }}
    >
      <Show when={!query.isLoading}>
        <RefreshIcon />
      </Show>
    </UnstyledButton>
  );
}
