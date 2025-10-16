import { Toaster, ToastProvider } from "solid-notifications";

import MainContent from "@/devtools/components/main-content/MainContent";
import Sidebar from "@/devtools/components/sidebar/Sidebar";
import { SidebarContextProvider } from "@/devtools/components/sidebar/sidebar-context";
import { IndexedDBContextProvide } from "@/devtools/utils/indexeddb-context";

import styles from "./App.module.css";

function App() {
  return (
    <ToastProvider
      limit={1}
      positionX="right"
      positionY="top"
      showProgressBar={false}
      dismissButtonStyle={{ "box-shadow": "none" }}
    >
      <Toaster />
      <div class={styles.app}>
        <IndexedDBContextProvide>
          <SidebarContextProvider>
            <Sidebar />
            <MainContent />
          </SidebarContextProvider>
        </IndexedDBContextProvide>
      </div>
    </ToastProvider>
  );
}

export default App;
