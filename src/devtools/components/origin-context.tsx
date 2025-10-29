import {
  Accessor,
  createContext,
  createSignal,
  FlowProps,
  onCleanup,
  onMount,
  Setter,
  useContext,
} from "solid-js";

const OriginContext = createContext<OriginContextType>();

export function useOriginContext() {
  const context = useContext(OriginContext);
  if (!context) {
    throw new Error("useOriginContext: cannot find OriginContext");
  }

  return context;
}

/**
 * Track the inspected window origin to reload the indexedDB list when
 * the user navigates to a new website
 */
export function OriginContextProvider(props: FlowProps) {
  const [origin, setOrigin] = createSignal<string | null>(null);
  // poll the origin every 5 seconds
  const timerId = setInterval(async () => {
    try {
      const origin = await getOrigin();
      setOrigin(origin);
    } catch (e) {
      console.error("get-origin: failure", e);
    }
  }, 5000);

  onMount(async () => {
    try {
      const origin = await getOrigin();
      setOrigin(origin);
    } catch (e) {
      console.error("get-origin: failure", e);
    }
  });
  onCleanup(() => {
    clearInterval(timerId);
  });

  return (
    <OriginContext.Provider value={{ origin, setOrigin }}>
      {props.children}
    </OriginContext.Provider>
  );
}

function getOrigin() {
  return new Promise<string>((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(
      "location.origin",
      (result: string, isException) => {
        if (isException) {
          reject(new Error("Unable to determine the inspected window origin."));
        } else {
          resolve(result);
        }
      },
    );
  });
}

interface OriginContextType {
  origin: Accessor<string | null>;
  setOrigin: Setter<string | null>;
}
