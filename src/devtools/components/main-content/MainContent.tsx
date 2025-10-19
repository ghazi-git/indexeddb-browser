import { Match, Show, Switch } from "solid-js";

import { useIndexedDBContext } from "@/devtools/components/indexeddb-context";
import MainContentHeader from "@/devtools/components/main-content/header/MainContentHeader";
import MainContentBanner from "@/devtools/components/main-content/MainContentBanner";
import MainContentContainer from "@/devtools/components/main-content/MainContentContainer";
import ObjectStoreView from "@/devtools/components/main-content/object-store-view/ObjectStoreView";

export default function MainContent() {
  const { databases } = useIndexedDBContext();

  return (
    <Switch>
      <Match when={databases.loading}>
        <MainContentContainer>
          <MainContentHeader />
          <MainContentBanner>Checking for IndexedDBs...</MainContentBanner>
        </MainContentContainer>
      </Match>
      <Match when={databases.error}>
        <MainContentContainer>
          <MainContentHeader />
          <MainContentBanner isError={true}>
            Unable to get the IndexedDB list.
          </MainContentBanner>
        </MainContentContainer>
      </Match>
      <Match when={databases()}>
        {(dbs) => (
          <Show
            when={dbs().length}
            fallback={
              <MainContentContainer>
                <MainContentHeader />
                <MainContentBanner>
                  No IndexedDB found. Click the refresh icon in the sidebar to
                  check again.
                </MainContentBanner>
              </MainContentContainer>
            }
          >
            <ObjectStoreView databases={dbs()} />
          </Show>
        )}
      </Match>
    </Switch>
  );
}
