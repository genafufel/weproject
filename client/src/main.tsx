// Сначала отключаем HMR - импортируем модуль до всего остального
import "./lib/hmr-disable";

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Перехватываем все сетевые ошибки
window.addEventListener('error', function(event) {
  // Проверяем, связана ли ошибка с загрузкой ресурсов
  if (event.target && (event.target as any).tagName) {
    const tagName = (event.target as any).tagName.toLowerCase();
    // Если это изображение, скрипт или другой внешний ресурс
    if (tagName === 'img' || tagName === 'script' || tagName === 'link') {
      console.log(`[Error Handler] Перехвачена ошибка загрузки ${tagName}:`, 
                  (event.target as any).src || (event.target as any).href);
      
      // Предотвращаем дальнейшую обработку ошибки
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }
  return true;
}, true);

// Устанавливаем глобальный обработчик ошибок консоли
const originalConsoleError = console.error;
console.error = function(...args) {
  // Проверяем, связана ли ошибка с загрузкой изображений или сетевыми запросами
  const errorString = args.join(' ');
  if (
    errorString.includes('Failed to load resource') || 
    errorString.includes('loading chunk') ||
    errorString.includes('image') ||
    errorString.includes('Unable to preload') ||
    errorString.includes('favicon.ico') ||
    errorString.includes('WebSocket') ||
    errorString.includes('hot update') ||
    errorString.includes('vite') ||
    errorString.includes('hmr')
  ) {
    // Подавляем эти ошибки в консоли
    return;
  }
  
  // Для остальных ошибок используем стандартное поведение
  return originalConsoleError.apply(console, args);
};

// Отключаем автоматические перезагрузки через Vite
try {
  // @ts-ignore - Глобальная переменная Vite может существовать
  if (window.__vite__) {
    // @ts-ignore
    window.__vite__ = null;
  }
} catch (e) {
  console.log('Ошибка при отключении Vite:', e);
}

// Рендерим приложение
createRoot(document.getElementById("root")!).render(<App />);
