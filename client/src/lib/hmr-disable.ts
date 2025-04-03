/**
 * Этот файл отключает HMR (Hot Module Replacement) в Vite путем перехвата соединения WebSocket
 * и блокировки всех сообщений, связанных с перезагрузкой страницы.
 */

// Перехватываем оригинальный WebSocket
const OriginalWebSocket = window.WebSocket;

// Определяем нашу версию WebSocket, которая будет блокировать соединения Vite
class HMRDisabledWebSocket extends WebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    super(url, protocols);
    
    // Проверяем, является ли это соединение Vite HMR
    const urlString = url.toString();
    const isViteHMR = urlString.includes('vite') || 
                      urlString.includes('hmr') || 
                      urlString.includes('ws');
    
    if (isViteHMR) {
      console.log('[HMR Disable] Перехвачено HMR-соединение Vite:', urlString);
      
      // Блокируем все сообщения от сервера
      this.addEventListener('message', (event) => {
        // Предотвращаем дальнейшую обработку сообщений, которые могут вызывать перезагрузку
        event.stopImmediatePropagation();
      }, true);
      
      // Предотвращаем автоматические переподключения
      let originalSend = this.send;
      this.send = function(data) {
        // Проверяем содержимое отправляемых данных
        if (typeof data === 'string' && 
           (data.includes('reconnect') || data.includes('reload'))) {
          console.log('[HMR Disable] Блокировка сообщения:', data);
          return; // Блокируем отправку
        }
        return originalSend.apply(this, [data]);
      };
    }
  }
}

// Заменяем стандартный WebSocket нашей версией
window.WebSocket = HMRDisabledWebSocket as any;

// Отключаем автоматические перезагрузки страницы
if (import.meta.hot) {
  console.log('[HMR Disable] Отключение автоматических перезагрузок страницы');
  
  // Принимаем обновления без перезагрузки
  import.meta.hot.accept();
  
  // Перехватываем события обновления
  // @ts-ignore - Переопределяем метод invalidate для предотвращения перезагрузок
  import.meta.hot.invalidate = () => {
    console.log('[HMR Disable] Блокировка invalidate для предотвращения перезагрузки');
  };
}

export default function disableHMR() {
  console.log('[HMR Disable] HMR успешно отключен');
}