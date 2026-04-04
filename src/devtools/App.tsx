import { ActiveObjectStoreContextProvider } from "@/devtools/components/active-object-store-context";
import { IndexedDBContextProvider } from "@/devtools/components/indexeddb-context";
import MainContent from "@/devtools/components/main-content/MainContent";
import { OriginContextProvider } from "@/devtools/components/origin-context";
import Sidebar from "@/devtools/components/sidebar/Sidebar";
import { SidebarContextProvider } from "@/devtools/components/sidebar/sidebar-context";
import { TableReloadContextProvider } from "@/devtools/components/table-reload-context";

import styles from "./App.module.css";

function App() {
  return (
    <div class={styles.app}>
      <OriginContextProvider>
        <IndexedDBContextProvider>
          <TableReloadContextProvider>
            <ActiveObjectStoreContextProvider>
              <SidebarContextProvider>
                <Sidebar />
                <MainContent />
              </SidebarContextProvider>
            </ActiveObjectStoreContextProvider>
          </TableReloadContextProvider>
        </IndexedDBContextProvider>
      </OriginContextProvider>
    </div>
  );
}

export default App;
