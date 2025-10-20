import { JSX, Match, Switch } from "solid-js";

import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";

import styles from "./ColumnsPopover.module.css";

export default function ColumnsPopover(props: ColumnsPopoverProps) {
  const { query } = useTableContext();

  return (
    <div class={styles.popover} popover {...props}>
      <Switch>
        <Match when={query.isLoading && !query.data}>
          <div class={styles["centered-message"]}>Loading table data...</div>
        </Match>
        <Match when={query.isError && !query.data}>
          <div class={`${styles["centered-message"]} ${styles.error}`}>
            {query.errorMsg}
          </div>
        </Match>
        <Match when={query.data}>
          {(tableData) => {
            if (tableData().canDisplay) {
              // todo display table containing the columns config
              return <table />;
            } else {
              return (
                <div>
                  This object store has no keypath. This <i>usually</i> means
                  that it has data not suitable for display in a table. Use the
                  native IndexedDB viewer instead.
                </div>
              );
            }
          }}
        </Match>
      </Switch>
    </div>
  );
}

type ColumnsPopoverProps = JSX.HTMLAttributes<HTMLDivElement>;
