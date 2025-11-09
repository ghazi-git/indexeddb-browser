import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useTableMutationContext } from "@/devtools/components/main-content/object-store-view/table-mutation-context";
import DeleteIcon from "@/devtools/components/svg-icons/DeleteIcon";

import styles from "./DeleteRowsButton.module.css";

export default function DeleteRowsButton() {
  const { tableMutationStore } = useTableMutationContext();
  const canDelete = () => tableMutationStore.selectedRowIDs.length > 0;
  return (
    <UnstyledButton
      class={styles.delete}
      title="Delete Selected Row(s)"
      aria-label="Delete Selected Row(s)"
      disabled={!canDelete()}
    >
      <DeleteIcon />
    </UnstyledButton>
  );
}
