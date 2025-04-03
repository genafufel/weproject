// Отключение Hot Module Replacement
if (window.__vite_plugin_react_preamble_installed__) {
  console.log('Найден Vite React Preamble, отключаем...');
  window.__vite_plugin_react_preamble_installed__ = false;
}

// Блокируем все WebSocket соединения от Vite
const originalWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
  const urlString = typeof url === 'string' ? url : url.toString();
  if (urlString.includes('vite') || urlString.includes('hmr') || urlString.includes(':5000/') || urlString.includes('ws')) {
    console.log('Блокировка WebSocket соединения:', urlString);
    return {
      addEventListener: function() {},
      removeEventListener: function() {},
      send: function() {},
      close: function() {},
      readyState: 3, // CLOSED
    };
  }
  return new originalWebSocket(url, protocols);
};

// Активируем обработку ошибок загрузки ресурсов
window.addEventListener('error', function(event) {
  if (event.target && 
     (event.target.tagName === 'IMG' || 
      event.target.tagName === 'SCRIPT' || 
      event.target.tagName === 'LINK')) {
    console.log('Перехвачена ошибка загрузки ресурса:', 
                event.target.src || event.target.href);
    // Предотвращаем действия по умолчанию
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  return true;
}, true);

// Отключаем перезагрузку страницы при ошибках
window.addEventListener('unhandledrejection', function(event) {
  console.log('Перехвачено необработанное отклонение Promise:', event.reason);
  event.preventDefault();
  return false;
});

// Подменяем console.error для фильтрации ошибок
const originalConsoleError = console.error;
console.error = function(...args) {
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
    errorString.includes('chunk') ||
    errorString.includes('hmr')
  ) {
    // Подавляем эти ошибки в консоли
    return;
  }
  
  // Для остальных ошибок используем стандартное поведение
  return originalConsoleError.apply(console, args);
};

console.log('Блокировка HMR активирована');