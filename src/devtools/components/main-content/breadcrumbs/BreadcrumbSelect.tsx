import { For, JSX, splitProps } from "solid-js";

import styles from "./BreadcrumbSelect.module.css";

export default function BreadcrumbSelect(props: BreadcrumbSelectProps) {
  const [local, selectProps] = splitProps(props, ["options", "class", "value"]);

  return (
    <select
      class={`${styles["base-select"]} ${local.class ?? ""}`}
      {...selectProps}
    >
      <button>
        {/* @ts-expect-error tag available in chrome since v135 */}
        <selectedcontent />
      </button>
      <For each={local.options}>
        {({ label, value }) => (
          <option value={value ?? ""} selected={value === local.value}>
            {label}
          </option>
        )}
      </For>
    </select>
  );
}

// some css styles are based on the empty value
export const EMPTY_VALUE = "---";

interface BreadcrumbSelectProps
  extends Omit<JSX.HTMLAttributes<HTMLSelectElement>, "children"> {
  options: { label: string; value: string }[];
  value?: string;
}
