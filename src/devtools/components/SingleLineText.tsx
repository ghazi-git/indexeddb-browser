import { onMount } from "solid-js";

import styles from "./SingleLineText.module.css";
/**
 * Adds an ellipsis when the text is too long to be shown on a single line
 * and shows the full text in a native browser tooltip.
 * The user of the component has to make sure the element has a defined
 * width/max-width or use flexbox to help.
 * https://leonardofaria.net/2020/07/18/using-flexbox-and-text-ellipsis-together
 */
export default function SingleLineText(props: SingleLineTextProps) {
  let ref: HTMLDivElement;
  onMount(() => {
    const observer = new ResizeObserver(() => {
      if (ref.scrollWidth > ref.clientWidth) {
        ref.setAttribute("title", props.text);
      } else {
        ref.removeAttribute("title");
      }
    });
    observer.observe(ref);
  });

  return (
    <div
      ref={(elt) => {
        ref = elt;
      }}
      class={`${styles.ellipsis} ${props.class ?? ""}`}
      dir="auto"
    >
      {props.text}
    </div>
  );
}

interface SingleLineTextProps {
  text: string;
  class?: string;
}
