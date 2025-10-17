import { Toaster, ToastProvider } from "solid-notifications";

import { ActiveObjectStoreContextProvider } from "@/devtools/components/active-object-store-context";
import { IndexedDBContextProvider } from "@/devtools/components/indexeddb-context";
import MainContent from "@/devtools/components/main-content/MainContent";
import { OriginContextProvider } from "@/devtools/components/origin-context";
import Sidebar from "@/devtools/components/sidebar/Sidebar";
import { SidebarContextProvider } from "@/devtools/components/sidebar/sidebar-context";

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
        <OriginContextProvider>
          <IndexedDBContextProvider>
            <ActiveObjectStoreContextProvider>
              <SidebarContextProvider>
                <Sidebar />
                <MainContent />
              </SidebarContextProvider>
            </ActiveObjectStoreContextProvider>
          </IndexedDBContextProvider>
        </OriginContextProvider>
      </div>
    </ToastProvider>
  );
}

export default App;
