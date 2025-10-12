import { splitProps } from "solid-js";

import { SVGProps } from "@/devtools/components/svg-icons/types";

import styles from "./TriangleIcon.module.css";

export default function TriangleIcon(props: TriangleIconProps) {
  const [extra, rest] = splitProps(props, ["class"]);
  const orientationCssClass = () => {
    if (props.orientation === "down") {
      return styles.down;
    } else if (props.orientation === "left") {
      return styles.left;
    } else if (props.orientation === "up") {
      return styles.up;
    } else {
      return "";
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      class={`${styles.triangle} ${orientationCssClass()} ${extra.class ?? ""}`}
      {...rest}
    >
      <path d="M6 12.796V3.204L11.481 8zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753" />
    </svg>
  );
}

interface TriangleIconProps extends SVGProps {
  orientation?: "up" | "down" | "left" | "right";
}
