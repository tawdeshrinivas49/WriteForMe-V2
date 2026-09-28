import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAccessibility } from "@/hooks/useAccessibility";
import { Type, Sun, Moon, Contrast, Highlighter, Languages, Minus, Plus } from "lucide-react";

export const AccessibilityToolbar = () => {
  const {
    fontSize,
    theme,
    highlightLinks,
    language,
    increaseFont,
    decreaseFont,
    toggleHighlightLinks,
    setLanguage,
    cycleTheme,
  } = useAccessibility();

  const themeIcons = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    "high-contrast": <Contrast className="w-4 h-4" />,
  };

  return (
    <div
      className="flex items-center gap-1"
      role="toolbar"
      aria-label="Accessibility controls"
    >
      <div className="flex items-center border rounded-md overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-none"
          onClick={decreaseFont}
          aria-label="Decrease font size"
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="px-2 text-xs font-medium min-w-[3rem] text-center">
          {fontSize === "small" && "A-"}
          {fontSize === "normal" && "A"}
          {fontSize === "large" && "A+"}
          {fontSize === "xlarge" && "A++"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-none"
          onClick={increaseFont}
          aria-label="Increase font size"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={cycleTheme}
        aria-label={`Current theme: ${theme}. Click to cycle.`}
      >
        {themeIcons[theme]}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${highlightLinks ? "bg-accent text-accent-foreground" : ""}`}
        onClick={toggleHighlightLinks}
        aria-label="Toggle highlight links"
      >
        <Highlighter className="w-4 h-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Select language">
            <Languages className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLanguage("en")}>
            English {language === "en" && "✓"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLanguage("hi")}>
            हिन्दी {language === "hi" && "✓"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
