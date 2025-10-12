chrome.devtools.panels.create(
  "IndexedDB",
  "",
  "/src/devtools/panel.html",
  async (panel) => {
    console.log("panel obj", panel);
    console.log("inspectedWindow", chrome.devtools.inspectedWindow);
  },
);
