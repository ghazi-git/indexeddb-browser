import UnstyledButton from "@/devtools/components/buttons/UnstyledButton";

export default function ModalCancelButton(props: { modalId: string }) {
  return (
    <UnstyledButton command="close" commandfor={props.modalId}>
      Cancel
    </UnstyledButton>
  );
}
