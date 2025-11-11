import { ValidationError, Validator } from "jsonschema";
import { PrismEditor } from "prism-code-editor";
import { createSignal, onMount, Show } from "solid-js";

import { useActiveObjectStoreContext } from "@/devtools/components/active-object-store-context";
import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import ErrorAlert from "@/devtools/components/main-content/object-store-view/ErrorAlert";
import { useTableContext } from "@/devtools/components/main-content/object-store-view/table-context";
import { useTableMutationContext } from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import CloseIcon from "@/devtools/components/svg-icons/CloseIcon";
import {
  DATA_MUTATION_ERROR_MSG,
  generateRequestID,
} from "@/devtools/utils/inspected-window-helpers";
import {
  createJSONEditor,
  parseJSONFromUser,
} from "@/devtools/utils/json-editor";
import {
  NewObject,
  TableColumn,
  TableColumnValue,
  TableRow,
} from "@/devtools/utils/types";

import styles from "./AddObjectsButton.module.css";

export default function AddObjectsButton() {
  const { createData } = useTableMutationContext();
  const { activeObjectStore } = useActiveObjectStoreContext();
  const { query, refetch } = useTableContext();
  const [error, setError] = createSignal<string[]>([]);
  let dialogRef!: HTMLDialogElement;
  let editorRef!: HTMLDivElement;
  let editor: PrismEditor;

  const onSaveClick = async () => {
    setError([]);
    const value = editor.value.trim();
    if (!value) {
      setError(["No value entered."]);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsedObj: any;
    try {
      parsedObj = parseJSONFromUser(value);
    } catch (e) {
      console.error("data-create: failure to parse", e);
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError([msg]);
      return;
    }

    if (!query.data?.columns?.length) {
      const msg = `Unable to add any object due to inability to determine the object store key.`;
      setError([msg]);
      return;
    }

    const cols = query.data.columns;
    const result = validateJsonSchema(parsedObj, cols);
    if (!result.valid) {
      const errors = result.errors.map((err) => generateErrorMsg(err));
      setError(errors);
      return;
    }

    const activeStore = activeObjectStore();
    if (!activeStore) {
      setError(["Unable to determine the object store"]);
      return;
    }

    const newObjects = getNewObjects(parsedObj as TableRow[], cols);
    try {
      await createData({
        requestID: generateRequestID(),
        dbName: activeStore.dbName,
        storeName: activeStore.storeName,
        objects: newObjects,
      });
      refetch();
      dialogRef.close();
      editor.setOptions({ value: getSampleValue(cols) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : DATA_MUTATION_ERROR_MSG;
      setError([msg]);
    }
  };

  onMount(() => {
    editor = createJSONEditor(
      editorRef,
      getSampleValue(query.data?.columns || []),
    );
  });

  return (
    <>
      <UnstyledButton
        class={styles["dialog-trigger"]}
        command="show-modal"
        commandfor="add-objects-modal"
      >
        Add Objects
      </UnstyledButton>
      <dialog ref={dialogRef} id="add-objects-modal" class={styles.dialog}>
        <header>
          <h2>Add Objects</h2>
          <UnstyledButton
            title="Close Modal"
            aria-label="Close Modal"
            command="close"
            commandfor="add-objects-modal"
          >
            <CloseIcon />
          </UnstyledButton>
        </header>
        <div ref={editorRef} />
        <small class={styles.hint}>
          The value entered must be an array of objects.
        </small>
        <small class={styles.hint}>
          The value of a date column must be in the format
          yyyy:mm:ddTHH:MM:SS[.fff]Z.
        </small>
        <small class={styles.hint}>
          The value of a bigint column must be a string of digits.
        </small>
        <Show when={error().length}>
          <ErrorAlert
            useMonoFont={true}
            errorMsg={error()}
            onClick={() => setError([])}
          />
        </Show>
        <footer>
          <UnstyledButton command="close" commandfor="add-objects-modal">
            Cancel
          </UnstyledButton>
          <UnstyledButton
            onClick={() => {
              onSaveClick();
            }}
          >
            Save
          </UnstyledButton>
        </footer>
      </dialog>
    </>
  );
}

function getSampleValue(columns: TableColumn[]) {
  const now = new Date();
  const keyValuePairs = columns.map((column) => {
    let value: TableColumnValue = null;
    if (column.datatype === "string") {
      value = "string";
    } else if (column.datatype === "number") {
      value = 0;
    } else if (column.datatype === "timestamp") {
      value = now.getTime();
    } else if (column.datatype === "boolean") {
      value = true;
    } else if (column.datatype === "date") {
      value = now.toISOString();
    } else if (column.datatype === "bigint") {
      value = "1234567890";
    }
    return [column.name, value] as [string, TableColumnValue];
  });
  const obj = Object.fromEntries(keyValuePairs);
  return JSON.stringify([obj], null, 2);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateJsonSchema(value: any, columns: TableColumn[]) {
  const schema = getJSONSchema(columns);
  const v = new Validator();
  return v.validate(value, schema);
}

function getJSONSchema(columns: TableColumn[]) {
  return {
    type: "array",
    items: {
      type: "object",
      properties: Object.fromEntries(
        columns.map((col) => [col.name, getPropertySchema(col)]),
      ),
    },
    minItems: 1,
  };
}

function getPropertySchema(column: TableColumn) {
  if (column.datatype === "string") {
    return { type: ["string", "null"] };
  } else if (column.datatype === "number") {
    return { type: ["number", "null"] };
  } else if (column.datatype === "timestamp") {
    return { type: ["integer", "null"], minimum: 0 };
  } else if (column.datatype === "boolean") {
    return { type: ["boolean", "null"] };
  } else if (column.datatype === "date") {
    return { type: ["string", "null"], format: "date-time" };
  } else if (column.datatype === "bigint") {
    return { type: ["string", "null"], pattern: "^-?\\d+$" };
  } else {
    // no validation for json-data and unsupported datatypes
    return {};
  }
}

function generateErrorMsg(error: ValidationError) {
  return `${error.property.replace("instance", "object")} ${error.message}`;
}

function getNewObjects(
  parsedObj: TableRow[],
  cols: TableColumn[],
): NewObject[] {
  return parsedObj.map((row) => {
    return Object.entries(row).map(([colName, colValue]) => {
      const col = cols.find((col) => col.name === colName);
      return {
        name: colName,
        value: colValue,
        // user can specify columns that the extension doesn't know about or
        // the user is adding the first objects when we have no info about
        // the datatypes
        datatype: col?.datatype ?? "unsupported",
      };
    });
  });
}
