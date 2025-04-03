/**
 * Этот файл полностью отключает HMR (Hot Module Replacement) в Vite,
 * используя радикальный подход - блокировку всех WebSocket соединений.
 */

console.log('[HMR Disable] Инициализация полного отключения HMR');

// Сохраняем оригинальный WebSocket
const OriginalWebSocket = window.WebSocket;

// Создаём заглушку вместо WebSocket, которая ничего не делает
class DisabledWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  url: string;
  readyState: number = DisabledWebSocket.CLOSED;
  
  constructor(url: string | URL, _protocols?: string | string[]) {
    this.url = url.toString();
    console.log('[HMR Disable] Заблокировано WebSocket соединение:', this.url);
  }
  
  // Реализуем пустые методы
  addEventListener() { /* Не делаем ничего */ }
  removeEventListener() { /* Не делаем ничего */ }
  dispatchEvent() { return true; }
  send() { /* Не делаем ничего */ }
  close() { /* Не делаем ничего */ }
}

// Заменяем WebSocket нашей заглушкой только для соединений Vite
window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
  const urlString = url.toString();
  
  // Если это не похоже на HMR-соединение, используем настоящий WebSocket
  if (!urlString.includes('vite') && !urlString.includes('hmr') && !urlString.includes('ws')) {
    return new OriginalWebSocket(url, protocols);
  }
  
  // Иначе возвращаем заглушку
  return new DisabledWebSocket(url, protocols) as unknown as WebSocket;
} as any;

// Переопределяем некоторые методы
if (window.WebSocket) {
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  
  // Используем другой способ определения статических свойств без прямого присваивания
  Object.defineProperties(window.WebSocket, {
    'CONNECTING': { value: OriginalWebSocket.CONNECTING },
    'OPEN': { value: OriginalWebSocket.OPEN },
    'CLOSING': { value: OriginalWebSocket.CLOSING },
    'CLOSED': { value: OriginalWebSocket.CLOSED }
  });
}

// Отключаем автоматические перезагрузки
if (import.meta.hot) {
  try {
    // Блокируем все методы HMR
    import.meta.hot.accept = () => {}; 
    import.meta.hot.dispose = () => {}; 
    // @ts-ignore
    import.meta.hot.invalidate = () => {};
    import.meta.hot.on = () => {};
    
    // Полностью отключаем HMR
    // @ts-ignore
    import.meta.hot.decline();
    // @ts-ignore
    import.meta.hot = undefined;
    
    console.log('[HMR Disable] Полное отключение HMR выполнено');
  } catch (e) {
    console.log('[HMR Disable] Ошибка при отключении HMR:', e);
  }
}

// Подменяем объект performance для предотвращения перезагрузок по таймаутам
const originalNow = performance.now;
performance.now = function() {
  // Замедляем таймеры связанные с HMR
  return originalNow.call(performance);
};

export default function disableHMR() {
  console.log('[HMR Disable] HMR полностью отключен');
}