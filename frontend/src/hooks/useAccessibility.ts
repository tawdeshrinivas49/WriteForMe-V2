import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FontSize = "small" | "normal" | "large" | "xlarge";
export type Language = "en" | "hi";
export type AppTheme = "light" | "dark" | "high-contrast";

interface AccessibilityState {
  fontSize: FontSize;
  highlightLinks: boolean;
  language: Language;
  theme: AppTheme;
  setFontSize: (size: FontSize) => void;
  increaseFont: () => void;
  decreaseFont: () => void;
  toggleHighlightLinks: () => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const fontSizes: FontSize[] = ["small", "normal", "large", "xlarge"];

export const useAccessibility = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      fontSize: "normal",
      highlightLinks: false,
      language: "en",
      theme: "light",
      setFontSize: (size) => set({ fontSize: size }),
      increaseFont: () => {
        const idx = fontSizes.indexOf(get().fontSize);
        if (idx < fontSizes.length - 1) {
          set({ fontSize: fontSizes[idx + 1] });
        }
      },
      decreaseFont: () => {
        const idx = fontSizes.indexOf(get().fontSize);
        if (idx > 0) {
          set({ fontSize: fontSizes[idx - 1] });
        }
      },
      toggleHighlightLinks: () => set((s) => ({ highlightLinks: !s.highlightLinks })),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      cycleTheme: () => {
        const themes: AppTheme[] = ["light", "dark", "high-contrast"];
        const idx = themes.indexOf(get().theme);
        set({ theme: themes[(idx + 1) % themes.length] });
      },
    }),
    { name: "sahayak-accessibility" }
  )
);
