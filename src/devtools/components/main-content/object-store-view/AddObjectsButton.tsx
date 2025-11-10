import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import CloseIcon from "@/devtools/components/svg-icons/CloseIcon";

import styles from "./AddObjectsButton.module.css";

export default function AddObjectsButton() {
  return (
    <>
      <UnstyledButton
        class={styles["dialog-trigger"]}
        command="show-modal"
        commandfor="add-objects-modal"
      >
        Add Objects
      </UnstyledButton>
      <dialog id="add-objects-modal" class={styles.dialog}>
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
        <div>JSON Editor Placeholder</div>
        <footer>
          <UnstyledButton command="close" commandfor="add-objects-modal">
            Cancel
          </UnstyledButton>
          <UnstyledButton
            onClick={() => {
              // todo add objects
            }}
          >
            Save
          </UnstyledButton>
        </footer>
      </dialog>
    </>
  );
}
