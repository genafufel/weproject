// Сервис для предварительной загрузки изображений
class ImagePreloader {
  private cache: Map<string, HTMLImageElement> = new Map();
  private queue: string[] = [];
  private loading: boolean = false;
  private maxConcurrent: number = 10; // Увеличим количество параллельных загрузок
  private currentLoading: number = 0;
  private priorityQueue: string[] = []; // Приоритетная очередь загрузки

  /**
   * Добавляет URL изображения в очередь на предзагрузку
   * @param url URL изображения или массив URL
   * @param priority Приоритетная загрузка
   */
  public preload(url: string | string[] | undefined | null, priority: boolean = false): void {
    if (!url) return;
    
    const urls = Array.isArray(url) ? url : [url];
    
    urls.forEach(imageUrl => {
      if (!imageUrl || this.cache.has(imageUrl)) return;
      
      // Нормализуем URL
      const normalizedUrl = this.normalizeImageUrl(imageUrl);
      
      // Добавляем URL в соответствующую очередь если он еще не в очереди
      if (priority) {
        if (!this.priorityQueue.includes(normalizedUrl) && !this.queue.includes(normalizedUrl)) {
          this.priorityQueue.unshift(normalizedUrl); // Добавляем в начало для быстрой загрузки
        }
      } else {
        if (!this.queue.includes(normalizedUrl) && !this.priorityQueue.includes(normalizedUrl)) {
          this.queue.push(normalizedUrl);
        }
      }
    });
    
    // Запускаем процесс загрузки, если он еще не запущен
    this.processQueue();
  }

  /**
   * Нормализует URL изображения
   */
  private normalizeImageUrl(url: string): string {
    if (!url) return url;
    
    // Если URL не начинается с /uploads или http(s), добавляем префикс
    if (!url.startsWith('/uploads') && !url.startsWith('http')) {
      return `/uploads/${url.split('/').pop()}`;
    }
    
    return url;
  }

  /**
   * Проверяет наличие изображения в кэше
   */
  public has(url: string): boolean {
    const normalizedUrl = this.normalizeImageUrl(url);
    return this.cache.has(normalizedUrl);
  }

  /**
   * Получает изображение из кэша
   */
  public get(url: string): HTMLImageElement | undefined {
    const normalizedUrl = this.normalizeImageUrl(url);
    return this.cache.get(normalizedUrl);
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
    if (this.loading || (this.priorityQueue.length === 0 && this.queue.length === 0) || 
        this.currentLoading >= this.maxConcurrent) return;
    
    this.loading = true;
    
    // Сначала обрабатываем приоритетную очередь
    while ((this.priorityQueue.length > 0 || this.queue.length > 0) && 
           this.currentLoading < this.maxConcurrent) {
      // Предпочитаем приоритетную очередь
      const url = this.priorityQueue.length > 0 
        ? this.priorityQueue.shift() 
        : this.queue.shift();
      
      if (!url) continue;
      
      this.currentLoading++;
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(url, img);
        this.currentLoading--;
        
        // Продолжаем обработку очереди
        if (this.priorityQueue.length > 0 || this.queue.length > 0) {
          this.processQueue();
        } else if (this.currentLoading === 0) {
          this.loading = false;
        }
      };
      
      img.onerror = () => {
        // Если загрузка не удалась, уменьшаем счетчик загружаемых и продолжаем
        this.currentLoading--;
        
        if (this.priorityQueue.length > 0 || this.queue.length > 0) {
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
   * Предзагружает изображения по URL на странице
   */
  public preloadImagesFromPage(): void {
    setTimeout(() => {
      // Найдем все изображения на странице
      const images = document.querySelectorAll('img');
      const imageUrls: string[] = [];
      
      images.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !this.cache.has(src)) {
          imageUrls.push(src);
        }
      });
      
      // Также добавим фоновые изображения
      const elements = document.querySelectorAll('[style*="background-image"]');
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const url = bgImage.slice(4, -1).replace(/['"]/g, '');
          if (url && !this.cache.has(url)) {
            imageUrls.push(url);
          }
        }
      });
      
      this.preload(imageUrls);
    }, 200); // Небольшая задержка, чтобы DOM успел загрузиться
  }

  /**
   * Предзагружает изображения из данных сообщений
   */
  public preloadFromMessages(messages: any[]): void {
    if (!messages || !Array.isArray(messages)) return;
    
    const imageUrls: string[] = [];
    
    messages.forEach(message => {
      // Предзагружаем вложенные изображения
      if (message.attachment && message.attachmentType === 'image') {
        imageUrls.push(message.attachment);
      }
      
      // Если есть множественные вложения, загружаем изображения из них
      if (message.attachments && Array.isArray(message.attachments)) {
        message.attachments.forEach((attachment: any) => {
          if (attachment.type === 'image' && attachment.url) {
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
        avatarUrls.push(user.avatar);
      }
    });
    
    // Аватары загружаем с высоким приоритетом
    this.preload(avatarUrls, true);
  }
  
  /**
   * Предзагружает изображения проектов
   */
  public preloadProjectImages(projects: any[]): void {
    if (!projects || !Array.isArray(projects)) return;
    
    const imageUrls: string[] = [];
    
    projects.forEach(project => {
      if (project.photo) {
        imageUrls.push(project.photo);
      }
    });
    
    this.preload(imageUrls);
  }
  
  /**
   * Предзагружает изображения резюме
   */
  public preloadResumeImages(resumes: any[]): void {
    if (!resumes || !Array.isArray(resumes)) return;
    
    const imageUrls: string[] = [];
    
    resumes.forEach(resume => {
      if (resume.photo) {
        imageUrls.push(resume.photo);
      }
    });
    
    this.preload(imageUrls);
  }
  /**
   * Глобальная предзагрузка изображений для всего сайта
   * - загружает аватары всех пользователей
   * - загружает изображения проектов и резюме
   * - загружает фоновые изображения
   */
  public async preloadGlobalImages(): Promise<void> {
    try {
      // Загружаем изображения на текущей странице
      this.preloadImagesFromPage();
      
      // Предзагружаем аватары пользователей
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        this.preloadAvatars(users);
      }
      
      // Предзагружаем изображения проектов
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json();
        this.preloadProjectImages(projects);
      }
      
      // Предзагружаем изображения резюме
      const resumesResponse = await fetch('/api/resumes');
      if (resumesResponse.ok) {
        const resumes = await resumesResponse.json();
        this.preloadResumeImages(resumes);
      }
    } catch (error) {
      console.error('Error preloading global images:', error);
    }
  }
  
  /**
   * Получает все URL изображений со страницы
   */
  public getAllImageUrlsFromPage(): string[] {
    const imageUrls: string[] = [];
    
    // Получаем все тег img на странице
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !imageUrls.includes(src)) {
        imageUrls.push(src);
      }
    });
    
    // Получаем все фоновые изображения
    const elements = document.querySelectorAll('[style*="background-image"]');
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const url = bgImage.slice(4, -1).replace(/['"]/g, '');
        if (url && !imageUrls.includes(url)) {
          imageUrls.push(url);
        }
      }
    });
    
    return imageUrls;
  }
}

// Создаем и экспортируем экземпляр сервиса
export const imagePreloader = new ImagePreloader();