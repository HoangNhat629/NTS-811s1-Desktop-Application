import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

export const LIGHT = "light";
export const DARK = "dark";

const LOCAL_STORAGE_KEY = "app_theme";

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored === DARK ? DARK : LIGHT;
    } catch {
      return LIGHT;
    }
  });

  useEffect(() => {
    const app = document.getElementById("app");
    if (app) {
      app.setAttribute("data-theme", theme);
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, theme);
    } catch {
      // ignore write errors
    }
  }, [theme]);

  const setTheme = useCallback((value) => {
    if (value === LIGHT || value === DARK) {
      setThemeState(value);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === LIGHT ? DARK : LIGHT));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;
