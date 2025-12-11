import { Schema, ValidationError, Validator } from "jsonschema";
import { PrismEditor } from "prism-code-editor";
import {
  createEffect,
  createMemo,
  createSignal,
  onMount,
  Show,
  untrack,
} from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import DatatypeValidationCheckbox from "@/devtools/components/main-content/object-store-view/DatatypeValidationCheckbox";
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
  SerializedObject,
  TableColumn,
  TableColumnValue,
  TableRow,
} from "@/devtools/utils/types";

import styles from "./AddObjectsButton.module.css";

export default function AddObjectsButton() {
  const { tableMutationStore, createData } = useTableMutationContext();
  const { query, refetch } = useTableContext();
  const [validateDatatypes, setValidateDatatypes] = createSignal(true);
  const [error, setError] = createSignal<string[]>([]);
  let dialogRef!: HTMLDialogElement;
  let editorRef!: HTMLDivElement;
  let editor: PrismEditor;

  const title = () => {
    return tableMutationStore.selectedObjects.length > 0
      ? "Edit Object(s)"
      : "Add Objects";
  };

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
      const msg = `Unable to save any object due to inability to determine the object store key.`;
      setError([msg]);
      return;
    }

    const cols = query.data.columns;
    const schema = validateDatatypes()
      ? getJSONSchemaWithDatatypesValidation(cols)
      : getSimpleJSONSchema();
    const result = validateJsonSchema(parsedObj, schema);
    if (!result.valid) {
      const errors = result.errors.map((err) => generateErrorMsg(err));
      setError(errors);
      return;
    }

    const newObjects = serializeObjects(parsedObj as TableRow[], cols);
    try {
      await createData({
        requestID: generateRequestID(),
        dbName: query.data.activeStore.dbName,
        storeName: query.data.activeStore.storeName,
        objects: newObjects,
      });
      refetch();
      dialogRef.close();
      editor.setOptions({ value: editorData() });
    } catch (e) {
      const msg = e instanceof Error ? e.message : DATA_MUTATION_ERROR_MSG;
      setError([msg]);
    }
  };

  onMount(() => {
    editor = createJSONEditor(editorRef, "");
  });
  const editorData = createMemo(() => {
    const activeStore = query.data?.activeStore;
    if (tableMutationStore.selectedObjects.length > 0) {
      return JSON.stringify(tableMutationStore.selectedObjects, null, 2);
    } else {
      if (activeStore) {
        const columns = untrack(() => query.data?.columns || []);
        return getSampleValue(columns);
      } else {
        return "";
      }
    }
  });
  createEffect(() => {
    editor.setOptions({ value: editorData() });
  });

  return (
    <>
      <UnstyledButton
        class={styles["dialog-trigger"]}
        command="show-modal"
        commandfor="add-edit-objects-modal"
      >
        {title()}
      </UnstyledButton>
      <dialog
        ref={dialogRef}
        id="add-edit-objects-modal"
        class={styles.dialog}
        onClose={() => setError([])}
      >
        <header>
          <h2>{title()}</h2>
          <UnstyledButton
            title="Close Modal"
            aria-label="Close Modal"
            command="close"
            commandfor="add-edit-objects-modal"
          >
            <CloseIcon />
          </UnstyledButton>
        </header>
        <div ref={editorRef} />
        <div class={styles.hint}>
          <div>The JSON value entered must be an array of objects.</div>
          <div>
            Use ctrl+M/ctrl+shift+M(Mac) to toggle the use of Tab for
            indentation.
          </div>
        </div>
        <DatatypeValidationCheckbox
          checked={validateDatatypes()}
          onChange={(event) => {
            setValidateDatatypes(event.target.checked);
          }}
        />
        <Show when={error().length}>
          <ErrorAlert
            useMonoFont={true}
            errorMsg={error()}
            onClick={() => setError([])}
          />
        </Show>
        <footer>
          <UnstyledButton command="close" commandfor="add-edit-objects-modal">
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
function validateJsonSchema(value: any, schema: Schema) {
  const v = new Validator();
  return v.validate(value, schema);
}

function getJSONSchemaWithDatatypesValidation(columns: TableColumn[]) {
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

function getSimpleJSONSchema() {
  return { type: "array", items: { type: "object" }, minItems: 1 };
}

function getPropertySchema(column: TableColumn) {
  const getType = (type: string, isKey: boolean) => {
    return isKey ? [type] : [type, "null"];
  };
  if (column.datatype === "string") {
    return { type: getType("string", column.isKey) };
  } else if (column.datatype === "number") {
    return { type: getType("number", column.isKey) };
  } else if (column.datatype === "timestamp") {
    return { type: getType("integer", column.isKey), minimum: 0 };
  } else if (column.datatype === "boolean") {
    return { type: getType("boolean", column.isKey) };
  } else if (column.datatype === "date") {
    return { type: getType("string", column.isKey), format: "date-time" };
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

function serializeObjects(
  parsedObj: TableRow[],
  cols: TableColumn[],
): SerializedObject[] {
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
