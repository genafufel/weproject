import { useState, useEffect } from "react";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ThemeSwitcherProps {
  variant?: "ghost" | "outline" | "default";
  isMenuItem?: boolean;
}

// Простая функция переключения темы без зависимости от ThemeProvider
function useSimpleTheme() {
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(
    () => (localStorage.getItem("ui-theme") as any) || "light"
  );

  const setTheme = (newTheme: "light" | "dark" | "system") => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    
    localStorage.setItem("ui-theme", newTheme);
    
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
    
    setThemeState(newTheme);
  };

  // Применяем тему при монтировании компонента
  useEffect(() => {
    setTheme(theme);
  }, []);

  return { theme, setTheme };
}

export function ThemeSwitcher({ variant = "outline", isMenuItem = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useSimpleTheme();

  if (isMenuItem) {
    return (
      <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
        <span>Переключить тему</span>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setTheme("light")}
            title="Светлая тема"
          >
            <SunIcon className={`h-4 w-4 ${theme === 'light' ? 'text-primary' : 'text-gray-500'}`} />
            <span className="sr-only">Светлая тема</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setTheme("dark")}
            title="Тёмная тема"
          >
            <MoonIcon className={`h-4 w-4 ${theme === 'dark' ? 'text-primary' : 'text-gray-500'}`} />
            <span className="sr-only">Тёмная тема</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setTheme("system")}
            title="Системная тема"
          >
            <MonitorIcon className={`h-4 w-4 ${theme === 'system' ? 'text-primary' : 'text-gray-500'}`} />
            <span className="sr-only">Системная тема</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="icon">
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Переключить тему</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <SunIcon className="mr-2 h-4 w-4" />
          <span>Светлая</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <MoonIcon className="mr-2 h-4 w-4" />
          <span>Тёмная</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <MonitorIcon className="mr-2 h-4 w-4" />
          <span>Системная</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}