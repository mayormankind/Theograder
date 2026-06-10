"use client";

import React, { createContext, useContext } from "react";

interface ThemeContextType {
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Apply light theme immediately to prevent flash
if (typeof window !== "undefined") {
  document.documentElement.setAttribute("data-theme", "light");
  document.documentElement.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ mounted: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
