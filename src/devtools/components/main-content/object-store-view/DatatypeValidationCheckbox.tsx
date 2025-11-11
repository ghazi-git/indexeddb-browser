import { JSX } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";

import styles from "./DatatypeValidationCheckbox.module.css";

export default function DatatypeValidationCheckbox(props: CheckboxProps) {
  return (
    <div class={styles.checkbox}>
      <label>
        <input type="checkbox" {...props} />
        <span>Validate object properties datatypes</span>
      </label>
      <UnstyledButton
        command="toggle-popover"
        commandfor="datatypes-popover"
        aria-label="Informantion on object properties validation"
      >
        i
      </UnstyledButton>
      <div id="datatypes-popover" popover>
        <p>
          The validation is according to the column datatypes under "Table
          Settings":
        </p>
        <p>- The value of a timestamp property must be an integer.</p>
        <p>
          - The value of a date property must be in the format
          <code>yyyy:mm:ddTHH:MM:SS[.fff]Z</code>.
        </p>
        <p>- The value of a bigint property must be a string of digits.</p>
        <p>- The datatypes "JSON Data" and "Unsupported" are not validated.</p>
        <p>
          - The values for the remaining datatypes must be of the correct type.
        </p>
      </div>
    </div>
  );
}

type CheckboxProps = Pick<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "checked" | "onChange"
>;
