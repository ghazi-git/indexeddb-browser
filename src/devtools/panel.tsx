/* @refresh reload */
import "./panel.css";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { render } from "solid-js/web";

import App from "./App";

ModuleRegistry.registerModules([AllCommunityModule]);

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error("Root element not found.");
}

render(() => <App />, root!);
