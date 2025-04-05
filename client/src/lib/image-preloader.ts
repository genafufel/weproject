// Сервис для предварительной загрузки изображений
class ImagePreloader {
  private cache: Map<string, HTMLImageElement> = new Map();
  private queue: string[] = [];
  private loading: boolean = false;
  private maxConcurrent: number = 5;
  private currentLoading: number = 0;

  /**
   * Добавляет URL изображения в очередь на предзагрузку
   */
  public preload(url: string | string[] | undefined | null): void {
    if (!url) return;
    
    const urls = Array.isArray(url) ? url : [url];
    
    urls.forEach(imageUrl => {
      if (!imageUrl || this.cache.has(imageUrl)) return;
      
      // Добавляем URL в очередь если он еще не в очереди
      if (!this.queue.includes(imageUrl)) {
        this.queue.push(imageUrl);
      }
    });
    
    // Запускаем процесс загрузки, если он еще не запущен
    this.processQueue();
  }

  /**
   * Проверяет наличие изображения в кэше
   */
  public has(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Очищает кэш изображений
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Обрабатывает очередь предзагрузки
   */
  private processQueue(): void {
    if (this.loading || this.queue.length === 0 || this.currentLoading >= this.maxConcurrent) return;
    
    this.loading = true;
    
    while (this.queue.length > 0 && this.currentLoading < this.maxConcurrent) {
      const url = this.queue.shift();
      if (!url) continue;
      
      this.currentLoading++;
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(url, img);
        this.currentLoading--;
        
        // Продолжаем обработку очереди
        if (this.queue.length > 0) {
          this.processQueue();
        } else if (this.currentLoading === 0) {
          this.loading = false;
        }
      };
      
      img.onerror = () => {
        // Если загрузка не удалась, уменьшаем счетчик загружаемых и продолжаем
        this.currentLoading--;
        
        if (this.queue.length > 0) {
          this.processQueue();
        } else if (this.currentLoading === 0) {
          this.loading = false;
        }
      };
      
      img.src = url;
    }
    
    // Если ничего не загружаем, сбрасываем флаг
    if (this.currentLoading === 0) {
      this.loading = false;
    }
  }

  /**
   * Предзагружает изображения из данных сообщений
   */
  public preloadFromMessages(messages: any[]): void {
    if (!messages || !Array.isArray(messages)) return;
    
    const imageUrls: string[] = [];
    
    messages.forEach(message => {
      // Предзагружаем вложенные изображения
      if (message.attachment && message.attachmentType?.startsWith('image/')) {
        imageUrls.push(message.attachment);
      }
      
      // Если есть множественные вложения, загружаем изображения из них
      if (message.attachments && Array.isArray(message.attachments)) {
        message.attachments.forEach((attachment: any) => {
          if (attachment.type?.startsWith('image/') && attachment.url) {
            imageUrls.push(attachment.url);
          }
        });
      }
    });
    
    this.preload(imageUrls);
  }

  /**
   * Предзагружает аватары пользователей
   */
  public preloadAvatars(users: any[]): void {
    if (!users || !Array.isArray(users)) return;
    
    const avatarUrls: string[] = [];
    
    users.forEach(user => {
      if (user.avatar) {
        const avatarUrl = user.avatar.startsWith('/uploads')
          ? user.avatar
          : `/uploads/${user.avatar.split('/').pop()}`;
        
        avatarUrls.push(avatarUrl);
      }
    });
    
    this.preload(avatarUrls);
  }
}

// Создаем и экспортируем экземпляр сервиса
export const imagePreloader = new ImagePreloader();