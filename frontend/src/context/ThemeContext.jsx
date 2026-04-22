import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const themeColors = {
    dark: {
      background: "#0a0a1a",
      cardBg: "#111122",
      border: "#1a1a2e",
      textPrimary: "#ffffff",
      textSecondary: "#8b94b0",
      accent: "#5a67d8",
      accentGlow: "rgba(90, 103, 216, 0.2)",
      success: "#48bb78",
      danger: "#f56565",
      warning: "#ed8936",
      info: "#4299e1",
      bgInner: "rgba(26, 26, 46, 0.5)",
      inputBg: "rgba(10, 10, 26, 0.8)",        // ✅ ADD THIS
      hoverBg: "rgba(90, 103, 216, 0.1)",      // ✅ ADD THIS
      textMuted: "#8b94b0",                     // ✅ ADD THIS
      cardBgElevated: "#1a1a2e",               // ✅ ADD THIS
    },
    light: {
      background: "#f5f5f5",
      cardBg: "#ffffff",
      border: "#e0e0e0",
      textPrimary: "#1a1a2e",
      textSecondary: "#666666",
      accent: "#5a67d8",
      accentGlow: "rgba(90, 103, 216, 0.1)",
      success: "#48bb78",
      danger: "#f56565",
      warning: "#ed8936",
      info: "#4299e1",
      bgInner: "#f0f0f0",
      inputBg: "#f5f5f5",                      // ✅ ADD THIS
      hoverBg: "rgba(90, 103, 216, 0.05)",     // ✅ ADD THIS
      textMuted: "#666666",                     // ✅ ADD THIS
      cardBgElevated: "#fafafa",               // ✅ ADD THIS
    }
  };

  const currentTheme = themeColors[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeColors: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};