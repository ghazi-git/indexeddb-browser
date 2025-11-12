import { Setter } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";
import DeleteIcon from "@/devtools/components/svg-icons/DeleteIcon";

import styles from "./DeleteSavedSettings.module.css";

export default function DeleteSavedSettings(props: DeleteSavedSettingsProps) {
  const { deleteSavedSettings } = useTableSettingsContext();

  return (
    <UnstyledButton
      class={styles["delete-settings"]}
      disabled={props.disabled}
      title={props.disabled ? "No saved settings to delete" : undefined}
      onClick={() => {
        deleteSavedSettings();
        props.setDisabled(true);
      }}
    >
      <DeleteIcon />
      Delete Saved Settings
    </UnstyledButton>
  );
}

interface DeleteSavedSettingsProps {
  disabled: boolean;
  setDisabled: Setter<boolean>;
}
