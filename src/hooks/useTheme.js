import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "consistai:theme";

/**
 * Dark is the console's baseline (it's the `:root` token set), so the
 * toggle adds a `light` class rather than a `dark` one. First visit
 * follows the OS setting; after that the choice is remembered.
 */
function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall through to system preference
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore — theme just won't persist across reloads
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  return { theme, toggleTheme };
}
