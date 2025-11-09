import { Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import LoadingIcon from "@/devtools/components/svg-icons/LoadingIcon";
import ReloadIcon from "@/devtools/components/svg-icons/ReloadIcon";

import styles from "./ReloadStore.module.css";

export default function ReloadStore() {
  const { query, refetch } = useTableContext();
  return (
    <UnstyledButton
      class={styles.reload}
      title={query.isLoading ? "Reloading data..." : "Reload store data"}
      onClick={() => {
        refetch();
      }}
    >
      <Show when={!query.isLoading} fallback={<LoadingIcon />}>
        <ReloadIcon />
      </Show>
    </UnstyledButton>
  );
}
