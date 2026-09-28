import { ReactNode, useEffect } from "react";
import { useAccessibility, type AppTheme } from "@/hooks/useAccessibility";
import { cn } from "@/lib/utils";

interface ThemeProviderProps {
  children: ReactNode;
}

const themeClassMap: Record<AppTheme, string> = {
  light: "light",
  dark: "dark",
  "high-contrast": "high-contrast",
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { theme, fontSize, highlightLinks } = useAccessibility();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "high-contrast");
    root.classList.add(themeClassMap[theme]);

    root.classList.remove("font-small", "font-normal", "font-large", "font-xlarge");
    root.classList.add(`font-${fontSize}`);

    root.classList.remove("highlight-links");
    if (highlightLinks) {
      root.classList.add("highlight-links");
    }
  }, [theme, fontSize, highlightLinks]);

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-300",
        themeClassMap[theme]
      )}
    >
      {children}
    </div>
  );
};
