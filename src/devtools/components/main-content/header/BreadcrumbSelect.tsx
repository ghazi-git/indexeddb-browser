import { For, JSX, splitProps } from "solid-js";

import Select from "@/devtools/components/Select";

import styles from "./BreadcrumbSelect.module.css";

export default function BreadcrumbSelect(props: BreadcrumbSelectProps) {
  const [local, selectProps] = splitProps(props, ["options", "class", "value"]);

  return (
    <Select
      class={`${styles["base-select"]} ${local.class ?? ""}`}
      {...selectProps}
    >
      <button>
        {/* @ts-expect-error tag available in chrome since v135 */}
        <selectedcontent />
      </button>
      <For each={local.options}>
        {({ label, value, subItem }) => (
          <option
            class={subItem ? styles["sub-item"] : ""}
            value={value}
            selected={value === local.value}
          >
            {label}
          </option>
        )}
      </For>
    </Select>
  );
}

interface BreadcrumbSelectProps extends Omit<
  JSX.SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> {
  ref?: (elt: HTMLSelectElement) => void;
  options: BreadcrumbSelectOption[];
  value: string;
}

export interface BreadcrumbSelectOption {
  label: string;
  value: string;
  subItem?: true;
}
