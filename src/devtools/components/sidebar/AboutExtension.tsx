import pkg from "../../../../package.json";
import styles from "./AboutExtension.module.css";

export default function AboutExtension() {
  const version = () => (import.meta.env.DEV ? "DEV" : `v${pkg.version}`);

  return (
    <div class={styles.about}>
      <a
        href="https://github.com/ghazi-git/indexeddb-browser/releases"
        title="https://github.com/ghazi-git/indexeddb-browser/releases"
        target="_blank"
      >
        {version()}
      </a>
      <a
        href="https://github.com/ghazi-git/indexeddb-browser/issues"
        title="https://github.com/ghazi-git/indexeddb-browser/issues"
        target="_blank"
      >
        (Report an issue)
      </a>
    </div>
  );
}
