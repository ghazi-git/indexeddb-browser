import MainContentHeader from "@/devtools/components/main-content/MainContentHeader";

import styles from "./MainContent.module.css";

export default function MainContent() {
  return (
    <main class={styles["main-content"]}>
      <MainContentHeader />
    </main>
  );
}
