import { useEffect, useRef, useState } from "react";
const THEME_KEY = "spedire-theme";
export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light",
  );
  const explicitChoice = useRef(false);
  useEffect(() => {
    try {
      explicitChoice.current = ["light", "dark"].includes(
        localStorage.getItem(THEME_KEY),
      );
    } catch {
      /* The switch also works when storage is blocked. */
    }
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      if (!explicitChoice.current) {
        const next = system.matches ? "dark" : "light";
        document.documentElement.dataset.theme = next;
        setTheme(next);
      }
    };
    system.addEventListener("change", update);
    return () => system.removeEventListener("change", update);
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    explicitChoice.current = true;
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* Keep the current session usable without storage. */
    }
  }
  return { theme, toggleTheme };
}
