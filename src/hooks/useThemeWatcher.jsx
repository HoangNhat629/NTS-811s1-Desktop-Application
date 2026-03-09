import { useEffect, useState } from "react";

export const useThemeWatcher = () => {
  const [theme, setTheme] = useState(
    document.getElementById("app")?.getAttribute("data-theme") || "light"
  );
  useEffect(() => {
    const app = document.getElementById("app");
    if (!app) return;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "data-theme") {
          const newTheme = app.getAttribute("data-theme");
          setTheme(newTheme);
        }
      }
    });

    observer.observe(app, { attributes: true });
    return () => observer.disconnect();
  }, []);
  return theme;
};
