import { PrismEditor } from "prism-code-editor";
import {
  createEffect,
  createMemo,
  createSignal,
  onMount,
  Show,
} from "solid-js";

import ButtonWithBorder from "@/devtools/components/buttons/ButtonWithBorder";
import DatatypeValidationCheckbox from "@/devtools/components/main-content/object-store-view/DatatypeValidationCheckbox";
import ErrorAlert from "@/devtools/components/main-content/object-store-view/ErrorAlert";
import { useTableMutationContext } from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import Modal from "@/devtools/components/modal/Modal";
import ModalCancelButton from "@/devtools/components/modal/ModalCancelButton";
import ModalFooter from "@/devtools/components/modal/ModalFooter";
import ModalHeader from "@/devtools/components/modal/ModalHeader";
import { useTableReloadContext } from "@/devtools/components/table-reload-context";
import {
  getDataWithInLineKeysSchema,
  getSampleValue,
  parseInput,
  SaveObjectError,
  serializeObjects,
  stringifyObjectsWithInlineKeys,
  validateColumns,
  validateDataSchema,
} from "@/devtools/utils/add-edit-objects";
import {
  DATA_MUTATION_ERROR_MSG,
  generateRequestID,
} from "@/devtools/utils/inspected-window-helpers";
import { createJSONEditor } from "@/devtools/utils/json-editor";
import {
  ActiveObjectStore,
  SerializedObject,
  TableColumn,
  TableRow,
} from "@/devtools/utils/types";

import styles from "./AddEditObjectsWithInLineKeys.module.css";

export default function AddEditObjectsWithInLineKeys(
  props: AddEditObjectsWithInLineKeysProps,
) {
  const {
    tableMutationStore,
    saveDataWithInLineKeysOperation,
    saveDataWithInLineKeys,
  } = useTableMutationContext();
  const { reloadTableData } = useTableReloadContext();
  const [validateDatatypes, setValidateDatatypes] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  let dialogRef: HTMLDialogElement;
  let editorRef!: HTMLDivElement;
  let editor: PrismEditor;

  const title = () => {
    return tableMutationStore.selectedObjects.length > 0
      ? "Edit Object(s)"
      : "Add Objects";
  };

  const onSaveClick = async () => {
    setError(null);
    let newObjects: SerializedObject[];
    try {
      validateColumns(props.columns);
      const parsedValue = parseInput(editor.value);
      const schema = getDataWithInLineKeysSchema(
        validateDatatypes(),
        props.columns,
      );
      validateDataSchema(parsedValue, schema);
      newObjects = serializeObjects(
        parsedValue as unknown as TableRow[],
        props.columns,
      );
    } catch (e) {
      const msg =
        e instanceof SaveObjectError
          ? e.message
          : "An unexpected error occurred during save.";
      setError(msg);
      return;
    }

    try {
      await saveDataWithInLineKeys({
        requestID: generateRequestID(),
        dbName: props.activeStore.dbName,
        storeName: props.activeStore.storeName,
        objects: newObjects,
      });
      reloadTableData();
      dialogRef.close();
      editor.setOptions({ value: editorData() });
    } catch (e) {
      const msg = e instanceof Error ? e.message : DATA_MUTATION_ERROR_MSG;
      setError(msg);
    }
  };

  onMount(() => {
    editor = createJSONEditor(editorRef, "");
  });
  const editorData = createMemo(() => {
    if (tableMutationStore.selectedObjects.length > 0) {
      return stringifyObjectsWithInlineKeys(
        tableMutationStore.selectedObjects,
        props.columns,
      );
    } else {
      const data = getSampleValue(props.columns);
      return stringifyObjectsWithInlineKeys(data, props.columns);
    }
  });
  createEffect(() => {
    editor.setOptions({ value: editorData() });
  });

  return (
    <>
      <ButtonWithBorder
        command="show-modal"
        commandfor="add-edit-objects-modal"
      >
        {title()}
      </ButtonWithBorder>
      <Modal
        ref={(elt) => {
          dialogRef = elt;
        }}
        id="add-edit-objects-modal"
        class={styles.dialog}
        onClose={() => setError(null)}
      >
        <ModalHeader title={title()} modalId="add-edit-objects-modal" />
        <div ref={(elt) => (editorRef = elt)} />
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
          <ModalCancelButton modalId="add-edit-objects-modal" />
          <ButtonWithBorder
            disabled={saveDataWithInLineKeysOperation.isLoading}
            onClick={() => onSaveClick()}
          >
            Save
          </ButtonWithBorder>
        </ModalFooter>
      </Modal>
    </>
  );
}

interface AddEditObjectsWithInLineKeysProps {
  columns: TableColumn[];
  activeStore: ActiveObjectStore;
}
