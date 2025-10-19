import { JSX } from "solid-js";

import styles from "./MainContentBanner.module.css";

export default function MainContentBanner(props: MainContentBannerProps) {
  return (
    <div class={`${styles.banner} ${props.isError ? styles.error : ""} `}>
      {props.children}
    </div>
  );
}

interface MainContentBannerProps {
  children: JSX.Element;
  isError?: boolean;
}
