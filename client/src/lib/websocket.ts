// Сервис для работы с WebSocket соединением

import { queryClient } from "./queryClient";

// Создаем класс для управления WebSocket соединением
class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 секунды

  // Инициализация WebSocket соединения
  public connect(userId: number): void {
    if (this.socket && this.isConnected && this.userId === userId) {
      console.log('WebSocket соединение уже установлено');
      return;
    }

    // Сохраняем ID пользователя
    this.userId = userId;
    
    // Определяем протокол (ws или wss) в зависимости от текущего протокола
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      // Обработчик успешного соединения
      this.socket.onopen = () => {
        console.log('WebSocket соединение установлено');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Отправляем сообщение об аутентификации
        this.authenticate();
      };
      
      // Обработчик входящих сообщений
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Ошибка при обработке WebSocket сообщения:', error);
        }
      };
      
      // Обработчик закрытия соединения
      this.socket.onclose = () => {
        console.log('WebSocket соединение закрыто');
        this.isConnected = false;
        
        // Пытаемся переподключиться
        this.tryReconnect();
      };
      
      // Обработчик ошибок
      this.socket.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
        this.isConnected = false;
      };
      
    } catch (error) {
      console.error('Ошибка при создании WebSocket соединения:', error);
    }
  }
  
  // Функция для попытки переподключения
  private tryReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Превышено максимальное количество попыток переподключения');
      return;
    }
    
    this.reconnectAttempts++;
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      if (this.userId) {
        this.connect(this.userId);
      }
    }, this.reconnectDelay);
  }
  
  // Отправка сообщения аутентификации
  private authenticate(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.userId) {
      return;
    }
    
    const authMessage = {
      type: 'auth',
      userId: this.userId
    };
    
    this.socket.send(JSON.stringify(authMessage));
  }
  
  // Обработчик входящих сообщений
  private handleMessage(data: any): void {
    console.log('Получено WebSocket сообщение:', data);
    
    switch (data.type) {
      case 'auth_success':
        console.log('WebSocket аутентификация успешна:', data.message);
        break;
        
      case 'notification':
        // Инвалидируем запросы для обновления уведомлений
        console.log('Получено новое уведомление через WebSocket:', data.data);
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
        
        // Показываем уведомление в браузере, если разрешено
        this.showBrowserNotification(data.data);
        break;
        
      default:
        console.log('Получено сообщение неизвестного типа:', data);
    }
  }
  
  // Показ браузерного уведомления
  private showBrowserNotification(notification: any): void {
    // Проверяем поддержку уведомлений и разрешения
    if (!("Notification" in window)) {
      console.log("Этот браузер не поддерживает уведомления рабочего стола");
      return;
    }
    
    // Подготавливаем заголовок и текст для уведомления
    let title = 'Новое уведомление';
    switch (notification.type) {
      case 'message':
        title = 'Новое сообщение';
        break;
      case 'application':
        title = 'Новая заявка на проект';
        break;
      case 'application_response':
        title = 'Ответ на вашу заявку';
        break;
    }
    
    // Если пользователь разрешил уведомления
    if (Notification.permission === "granted") {
      new Notification(title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    } 
    // Если пользователь не запретил, но и не разрешил - запрашиваем разрешение
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      });
    }
  }
  
  // Отключение от WebSocket сервера
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      console.log('WebSocket соединение закрыто');
    }
  }
}

// Создаем и экспортируем единственный экземпляр сервиса
export const websocketService = new WebSocketService();