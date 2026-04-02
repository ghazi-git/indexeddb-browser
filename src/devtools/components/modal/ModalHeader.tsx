import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";
import CloseIcon from "@/devtools/components/svg-icons/CloseIcon";

import styles from "./ModalHeader.module.css";

export default function ModalHeader(props: ModalHeaderProps) {
  return (
    <header class={styles.header}>
      <h2>{props.title}</h2>
      <UnstyledButton
        class={styles.close}
        title="Close Modal"
        aria-label="Close Modal"
        command="close"
        commandfor={props.modalId}
      >
        <CloseIcon />
      </UnstyledButton>
    </header>
  );
}

interface ModalHeaderProps {
  title: string;
  modalId: string;
}
