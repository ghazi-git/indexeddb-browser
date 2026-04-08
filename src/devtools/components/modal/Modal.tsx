import { FlowProps, JSX, onCleanup, onMount, splitProps } from "solid-js";

import styles from "./Modal.module.css";

export default function Modal(props: ModalProps) {
  const [local, rest] = splitProps(props, ["class", "ref"]);

  let modalRef: HTMLDialogElement;
  const closeModal = (event: KeyboardEvent) => {
    // In chrome devtools, the default action for escape press is to toggle the
    // bottom tools drawer. The only way to stop that is to stop event propagation
    // at the window level during the capture phase. After doing that, we also
    // need to manually close the modal.
    if (
      event.key === "Escape" &&
      modalRef.contains(event.target as HTMLElement)
    ) {
      event.stopPropagation();
      modalRef.close();
    }
  };
  onMount(() => window.addEventListener("keydown", closeModal, true));
  onCleanup(() => window.removeEventListener("keydown", closeModal, true));

  return (
    <dialog
      ref={(elt) => {
        modalRef = elt;
        if (local.ref) local.ref(elt);
      }}
      class={`${styles.dialog} ${local.class ?? ""}`}
      {...rest}
    >
      {props.children}
    </dialog>
  );
}

type DialogProps = JSX.DialogHtmlAttributes<HTMLDialogElement>;
interface ModalProps extends FlowProps<DialogProps> {
  ref?: (el: HTMLDialogElement) => void;
}
