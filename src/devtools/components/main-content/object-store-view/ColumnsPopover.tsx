import { JSX, Show } from "solid-js";

import ColumnsConfig from "@/devtools/components/main-content/object-store-view/ColumnsConfig";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";

import styles from "./ColumnsPopover.module.css";

export default function ColumnsPopover(props: ColumnsPopoverProps) {
  const { query } = useTableContext();

  return (
    <div class={styles.popover} popover {...props}>
      <Show when={query.data}>
        {(data) => <ColumnsConfig tableData={data()} />}
      </Show>
    </div>
  );
}

type ColumnsPopoverProps = JSX.HTMLAttributes<HTMLDivElement>;
