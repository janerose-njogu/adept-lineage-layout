import FlowCanvas from '@/pages/FlowCanvas';
import { createContext, useContext } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export default function Lineage() {
  return (
    <main>
      <ThemeProviderContext.Provider value={initialState}>
        <FlowCanvas />
      </ThemeProviderContext.Provider>
    </main>
  );
}
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};