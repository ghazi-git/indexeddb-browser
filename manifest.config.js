import { defineManifest } from "@crxjs/vite-plugin";

import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  // v129 latest anchor positioning changes shipped
  // v135 base-select/command/commandfor
  minimum_chrome_version: "135",
  icons: {
    48: "public/idb-browser-48x48.png",
    96: "public/idb-browser-96x96.png",
    128: "public/idb-browser-128x128.png",
  },
  devtools_page: "src/devtools/index.html",
  action: {
    default_icon: "public/idb-browser-48x48.png",
    default_popup: "src/popup.html",
    default_title: "IndexedDB Browser",
  },
});
