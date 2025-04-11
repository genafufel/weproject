import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Простая функция переключения темы без зависимости от ThemeProvider
function useSimpleTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">(
    () => {
      // Получаем текущую тему из локального хранилища
      const savedTheme = localStorage.getItem("ui-theme");
      
      // Если значение 'system' или некорректное, используем 'light' по умолчанию
      if (!savedTheme || savedTheme === "system" || (savedTheme !== "light" && savedTheme !== "dark")) {
        return "light";
      }
      return savedTheme as "light" | "dark";
    }
  );

  const setTheme = (newTheme: "light" | "dark") => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    
    localStorage.setItem("ui-theme", newTheme);
    root.classList.add(newTheme);
    
    setThemeState(newTheme);
  };

  // Применяем тему при монтировании компонента
  useEffect(() => {
    setTheme(theme);
  }, []);

  return { theme, setTheme };
}

export function ThemeToggle() {
  const { theme, setTheme } = useSimpleTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center space-x-2">
      <SunIcon className={`h-4 w-4 ${!isDark ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
      <Switch 
        checked={isDark}
        onCheckedChange={(checked) => {
          setTheme(checked ? "dark" : "light");
        }}
        className="data-[state=checked]:bg-primary"
        aria-label="Переключить тему"
      />
      <MoonIcon className={`h-4 w-4 ${isDark ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
    </div>
  );
}