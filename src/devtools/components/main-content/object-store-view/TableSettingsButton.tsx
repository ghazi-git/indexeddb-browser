import { createSignal } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import ColumnsAutosize from "@/devtools/components/main-content/object-store-view/ColumnsAutosize";
import ColumnsConfig from "@/devtools/components/main-content/object-store-view/ColumnsConfig";
import DeleteSavedSettings from "@/devtools/components/main-content/object-store-view/DeleteSavedSettings";
import PaginationSetting from "@/devtools/components/main-content/object-store-view/PaginationSetting";
import RecordsCountSetting from "@/devtools/components/main-content/object-store-view/RecordsCountSetting";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings-context";
import TriangleIcon from "@/devtools/components/svg-icons/TriangleIcon";

import styles from "./TableSettingsButton.module.css";

export default function TableSettingsButton() {
  const { hasSavedSettings } = useTableSettingsContext();
  const [isOpen, setIsOpen] = createSignal(false);
  const [isDeleteDisabled, setIsDeleteDisabled] = createSignal(false);

  return (
    <>
      <UnstyledButton
        class={`${styles["popover-trigger"]} ${isOpen() ? styles.open : ""}`}
        popovertarget="columns-popover"
      >
        Table Settings
        <TriangleIcon orientation={isOpen() ? "up" : "down"} />
      </UnstyledButton>
      <div
        class={styles.popover}
        popover
        id="columns-popover"
        onToggle={(event) => {
          setIsOpen(event.newState === "open");
          if (event.newState === "open") {
            setIsDeleteDisabled(!hasSavedSettings());
          }
        }}
      >
        <div class={styles["settings-container"]}>
          <ColumnsConfig />
          <ColumnsAutosize />
          <RecordsCountSetting />
          <PaginationSetting />
          <DeleteSavedSettings
            disabled={isDeleteDisabled()}
            setDisabled={setIsDeleteDisabled}
          />
        </div>
      </div>
    </>
  );
}
