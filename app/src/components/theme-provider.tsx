"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_THEME,
  STORAGE_KEY,
  THEME_MODES,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (next: ThemeMode) => void;
  cycle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start from DEFAULT; the inline init script in <head> already stamped the
  // right `data-theme` before paint. We re-read it on mount to sync React state.
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_THEME);

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark" || attr === "system") {
      setModeState(attr);
    }
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures (private mode, quota)
    }
  }, []);

  const cycle = useCallback(() => {
    const i = THEME_MODES.indexOf(mode);
    setMode(THEME_MODES[(i + 1) % THEME_MODES.length]);
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, cycle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
