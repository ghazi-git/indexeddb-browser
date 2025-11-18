import { createSignal } from "solid-js";

import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import ColumnsAutosize from "@/devtools/components/main-content/object-store-view/table-settings/ColumnsAutosize";
import ColumnsConfig from "@/devtools/components/main-content/object-store-view/table-settings/ColumnsConfig";
import { useTableSettingsContext } from "@/devtools/components/main-content/object-store-view/table-settings/context";
import DeleteSavedSettings from "@/devtools/components/main-content/object-store-view/table-settings/DeleteSavedSettings";
import ObjectsCountSetting from "@/devtools/components/main-content/object-store-view/table-settings/ObjectsCountSetting";
import PaginationSetting from "@/devtools/components/main-content/object-store-view/table-settings/PaginationSetting";
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
          <ObjectsCountSetting />
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
