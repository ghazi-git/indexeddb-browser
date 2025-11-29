const panelName = import.meta.env.DEV ? "IndexedDB (DEV)" : "IndexedDB";
chrome.devtools.panels.create(panelName, "", "/src/devtools/panel.html");
