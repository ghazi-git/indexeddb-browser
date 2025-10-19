import { createSignal, Show } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import RefreshIcon from "@/devtools/components/svg-icons/RefreshIcon";

import styles from "./ReloadStore.module.css";

export default function ReloadStore() {
  const [loading, setLoading] = createSignal(false);
  return (
    <UnstyledButton
      class={styles.reload}
      title={loading() ? "Reloading data..." : "Reload store data"}
      loading={loading()}
      onClick={() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1000);
      }}
    >
      <Show when={!loading()}>
        <RefreshIcon />
      </Show>
    </UnstyledButton>
  );
}
