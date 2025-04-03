import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/hmr-disable"; // Импортируем модуль для отключения HMR

// Устанавливаем глобальный обработчик ошибок для предотвращения циклических перезагрузок
const originalConsoleError = console.error;
console.error = function(...args) {
  // Проверяем, связана ли ошибка с загрузкой изображений или сетевыми запросами
  const errorString = args.join(' ');
  if (
    errorString.includes('Failed to load resource') || 
    errorString.includes('loading chunk') ||
    errorString.includes('image') ||
    errorString.includes('Unable to preload')
  ) {
    // Подавляем эти ошибки в консоли
    return;
  }
  
  // Для остальных ошибок используем стандартное поведение
  return originalConsoleError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
