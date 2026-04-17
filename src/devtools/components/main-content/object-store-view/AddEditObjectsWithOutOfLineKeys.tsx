import { createEffect, createMemo, createSignal, on, Show } from "solid-js";

import ButtonWithBorder from "@/devtools/components/buttons/ButtonWithBorder";
import DatatypeValidationCheckbox from "@/devtools/components/main-content/object-store-view/DatatypeValidationCheckbox";
import Editor from "@/devtools/components/main-content/object-store-view/Editor";
import ErrorAlert from "@/devtools/components/main-content/object-store-view/ErrorAlert";
import { useTableMutationContext } from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import Modal from "@/devtools/components/modal/Modal";
import ModalCancelButton from "@/devtools/components/modal/ModalCancelButton";
import ModalFooter from "@/devtools/components/modal/ModalFooter";
import ModalHeader from "@/devtools/components/modal/ModalHeader";
import { useTableReloadContext } from "@/devtools/components/table-reload-context";
import {
  getPropertySchema,
  parseInput,
  SaveObjectError,
  stringifyData,
  validateDataSchema,
} from "@/devtools/utils/add-edit-objects";
import {
  DATA_MUTATION_ERROR_MSG,
  generateRequestID,
} from "@/devtools/utils/inspected-window-helpers";
import {
  ActiveObjectStore,
  DataValue,
  TableColumn,
} from "@/devtools/utils/types";

import styles from "./AddEditObjectsWithOutOfLineKeys.module.css";

export default function AddEditObjectsWithOutOfLineKeys(
  props: AddEditObjectsWithOutOfLineKeysProps,
) {
  const {
    tableMutationStore,
    saveDataWithOutOfLineKeys,
    saveDataWithOutOfLineKeysOperation,
  } = useTableMutationContext();
  const { reloadTableData } = useTableReloadContext();
  const [validateDatatypes, setValidateDatatypes] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const editDisabled = () => tableMutationStore.selectedObjects.length > 1;
  const addMode = () => tableMutationStore.selectedObjects.length === 0;

  const title = () => {
    return tableMutationStore.selectedObjects.length > 0
      ? "Edit Object"
      : "Add Object";
  };

  const [key, setKey] = createSignal("");
  createEffect(
    on(
      () => tableMutationStore.selectedObjects,
      // reset the value of the keyEditor on selection change
      () => setKey(""),
      { defer: true },
    ),
  );
  const [value, setValue] = createSignal("");
  const valueEditorData = createMemo(() => {
    const objs = tableMutationStore.selectedObjects;
    return objs.length === 1 ? stringifyData(objs[0].value) : "";
  });
  createEffect(() => setValue(valueEditorData()));

  let dialogRef: HTMLDialogElement;
  const onSaveClick = async () => {
    setError(null);

    const keyColumn = props.columns.find((c) => c.name === "key");
    const valueColumn = props.columns.find((c) => c.name === "value");
    if (!keyColumn || !valueColumn) {
      setError("Unable to determine the key or value columns.");
      return;
    }
    if (
      keyColumn.datatype === "unsupported" ||
      valueColumn.datatype === "unsupported"
    ) {
      const msg = `Unable to save because the key or value datatype is unsupported.`;
      setError(msg);
      return;
    }

    let objKey: DataValue, objValue: DataValue;
    try {
      if (addMode()) {
        if (props.autoincrement && !key().trim()) {
          // the key is optional when `store.autoincrement` is true
          objKey = { value: undefined, datatype: keyColumn.datatype };
        } else {
          const parsedKey = parseInput(key(), "Key: ");
          if (validateDatatypes()) {
            const schema = getPropertySchema(keyColumn);
            validateDataSchema(parsedKey, schema, "Key: ");
          }
          objKey = {
            value: parsedKey,
            datatype: keyColumn.datatype,
          } as DataValue;
        }
      } else {
        const selected = tableMutationStore.selectedObjects[0];
        if (selected?.key == null) {
          const msg = "Unable to determine the selected object key.";
          throw new SaveObjectError(msg);
        }
        objKey = { value: selected.key, datatype: keyColumn.datatype };
      }
      const errorPrefix = addMode() ? "Value: " : undefined;
      const parsedValue = parseInput(value(), errorPrefix);
      if (validateDatatypes()) {
        const schema = getPropertySchema(valueColumn);
        validateDataSchema(parsedValue, schema, errorPrefix);
      }
      objValue = {
        value: parsedValue,
        datatype: valueColumn.datatype,
      } as DataValue;
    } catch (e) {
      const msg =
        e instanceof SaveObjectError
          ? e.message
          : "An unexpected error occurred during save.";
      setError(msg);
      return;
    }

    try {
      await saveDataWithOutOfLineKeys({
        requestID: generateRequestID(),
        dbName: props.activeStore.dbName,
        storeName: props.activeStore.storeName,
        key: objKey,
        value: objValue,
      });
      reloadTableData();
      dialogRef.close();
      setKey("");
      setValue(valueEditorData());
    } catch (e) {
      const msg = e instanceof Error ? e.message : DATA_MUTATION_ERROR_MSG;
      setError(msg);
    }
  };

  return (
    <>
      <ButtonWithBorder command="show-modal" commandfor="add-edit-object-modal">
        {title()}
      </ButtonWithBorder>
      <Modal
        ref={(elt) => {
          dialogRef = elt;
        }}
        id="add-edit-object-modal"
        class={styles.dialog}
        onClose={() => setError(null)}
      >
        <ModalHeader title={title()} modalId="add-edit-object-modal" />
        <Show
          when={!editDisabled()}
          fallback={<div>Please select only one object to edit.</div>}
        >
          <Show when={addMode()}>
            <Editor
              class={styles["key-editor"]}
              value={key()}
              setValue={setKey}
              placeholder={`Enter key${props.autoincrement ? " (optional)" : ""}`}
            />
          </Show>
          <Editor
            value={value()}
            setValue={setValue}
            placeholder="Enter value"
          />
          <div class={styles.hint}>
            Use ctrl+M/ctrl+shift+M(Mac) to toggle the use of Tab between
            indentation and moving out of the editor.
          </div>
          <DatatypeValidationCheckbox
            checked={validateDatatypes()}
            onChange={(event) => {
              setValidateDatatypes(event.target.checked);
            }}
          />
          <Show when={error()}>
            {(e) => (
              <ErrorAlert
                useMonoFont={true}
                class={styles.error}
                errorMsg={e()}
                onClick={() => setError(null)}
              />
            )}
          </Show>
          <ModalFooter>
            <ModalCancelButton modalId="add-edit-object-modal" />
            <ButtonWithBorder
              disabled={saveDataWithOutOfLineKeysOperation.isLoading}
              onClick={() => onSaveClick()}
            >
              Save
            </ButtonWithBorder>
          </ModalFooter>
        </Show>
      </Modal>
    </>
  );
}

interface AddEditObjectsWithOutOfLineKeysProps {
  columns: TableColumn[];
  activeStore: ActiveObjectStore;
  autoincrement: boolean;
}
