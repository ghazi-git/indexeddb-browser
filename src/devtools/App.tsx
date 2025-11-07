import { ActiveObjectStoreContextProvider } from "@/devtools/components/active-object-store-context";
import { IndexedDBContextProvider } from "@/devtools/components/indexeddb-context";
import MainContent from "@/devtools/components/main-content/MainContent";
import { OriginContextProvider } from "@/devtools/components/origin-context";
import Sidebar from "@/devtools/components/sidebar/Sidebar";
import { SidebarContextProvider } from "@/devtools/components/sidebar/sidebar-context";
import { ThemeContextProvider } from "@/devtools/utils/ui-theme-context";

import styles from "./App.module.css";

function App() {
  return (
    <ThemeContextProvider>
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
    </ThemeContextProvider>
  );
}

export default App;
