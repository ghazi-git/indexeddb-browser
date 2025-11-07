import {
  Accessor,
  createContext,
  createSignal,
  FlowProps,
  onMount,
  useContext,
} from "solid-js";

const ThemeContext = createContext<{ theme: Accessor<Theme> }>();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme: cannot find ThemeContext");
  }

  return context;
}

export function ThemeContextProvider(props: FlowProps) {
  const [theme, setTheme] = createSignal<Theme>("light");
  onMount(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", ({ matches: isDark }) => {
        const systemTheme = isDark ? "dark" : "light";
        setTheme(systemTheme);
      });
  });

  return (
    <ThemeContext.Provider value={{ theme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

type Theme = "light" | "dark";
