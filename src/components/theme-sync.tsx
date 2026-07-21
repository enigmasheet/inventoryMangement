"use client";

import { useEffect } from "react";

export function ThemeSync() {
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "theme") {
        if (e.newValue === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  return null;
}
