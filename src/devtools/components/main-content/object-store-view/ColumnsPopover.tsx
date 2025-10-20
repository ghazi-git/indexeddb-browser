import { JSX, Match, Switch } from "solid-js";

import ColumnsConfig from "@/devtools/components/main-content/object-store-view/ColumnsConfig";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";

import styles from "./ColumnsPopover.module.css";

export default function ColumnsPopover(props: ColumnsPopoverProps) {
  const { query } = useTableContext();

  return (
    <div class={styles.popover} popover {...props}>
      <Switch>
        <Match when={query.isLoading && !query.data}>
          <div>Loading table data...</div>
        </Match>
        <Match when={query.isError && !query.data}>
          <div class={styles.error}>{query.errorMsg}</div>
        </Match>
        <Match when={query.data}>
          {(data) => <ColumnsConfig tableData={data()} />}
        </Match>
      </Switch>
    </div>
  );
}

type ColumnsPopoverProps = JSX.HTMLAttributes<HTMLDivElement>;
