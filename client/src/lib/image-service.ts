interface ImageState {
  loaded: boolean;
  error: boolean;
  url: string;
  element?: HTMLImageElement;
  timestamp: number;
}

/**
 * Класс для кэширования и работы с изображениями
 */
class ImageCache {
  private static instance: ImageCache;
  private cache: Map<string, ImageState> = new Map();
  private loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  private defaultImage: string = '/uploads/default.jpg';
  private defaultAvatarImage: string = '/uploads/default-avatar.jpg';
  private defaultProjectImage: string = '/uploads/default-project.jpg';
  private defaultResumeImage: string = '/uploads/default-resume.jpg';
  private preloadQueue: string[] = [];
  private isProcessingQueue: boolean = false;
  private concurrentLoads: number = 5; // Количество одновременных загрузок
  private domainRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/;
  private apiBasePaths = ['/api/users', '/api/projects', '/api/resumes', '/api/public'];

  private constructor() {
    // Проверяем наличие браузерного окружения (для SSR-совместимости)
    if (typeof window !== 'undefined') {
      // Инициализируем дефолтные изображения
      this.preloadDefaultImages();
      
      // Запускаем очистку кэша по таймеру
      setInterval(() => this.clearOldCache(), 3600000); // Раз в час
      
      // Запускаем предзагрузку при загрузке страницы
      console.log("🚀 Запускаем предзагрузку изображений при загрузке страницы");
      setTimeout(() => {
        this.preloadFromApi();
      }, 3000); // Запускаем через 3 секунды после загрузки страницы
      
      // Обработчики состояния онлайн/офлайн
      window.addEventListener('online', () => this.handleOnlineStatusChange(true));
      window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    }
  }

  /**
   * Получает экземпляр кэша изображений (Singleton)
   */
  public static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
      console.log("🖼️ ImageCache инициализирован, дефолтные изображения загружены");
    }
    return ImageCache.instance;
  }

  /**
   * Предзагрузка дефолтных изображений
   */
  private preloadDefaultImages(): void {
    this.loadImage(this.defaultImage).catch(() => {
      console.warn("⚠️ Не удалось загрузить дефолтное изображение:", this.defaultImage);
    });
    
    this.loadImage(this.defaultAvatarImage).catch(() => {
      console.warn("⚠️ Не удалось загрузить дефолтное изображение аватара:", this.defaultAvatarImage);
    });
    
    this.loadImage(this.defaultProjectImage).catch(() => {
      console.warn("⚠️ Не удалось загрузить дефолтное изображение проекта:", this.defaultProjectImage);
    });
    
    this.loadImage(this.defaultResumeImage).catch(() => {
      console.warn("⚠️ Не удалось загрузить дефолтное изображение резюме:", this.defaultResumeImage);
    });
  }

  /**
   * Нормализует URL изображения
   * @param url Исходный URL изображения или массив URL
   * @returns Нормализованный URL
   */
  public normalizeUrl(url: string | string[] | undefined | null): string {
    // Обработка null или undefined
    if (!url) return '';
    
    // Обработка массива URL (берем первый элемент)
    if (Array.isArray(url)) {
      console.debug("⚠️ Получен массив URL. Используем первый элемент:", url);
      return url.length > 0 ? this.normalizeUrl(url[0]) : '';
    }
    
    // Обработка не строкового типа
    if (typeof url !== 'string') {
      console.debug("⚠️ URL не является строкой:", url);
      return '';
    }
    
    // Проверка на JSON-строку, содержащую массив
    if (url.startsWith('[') && url.endsWith(']')) {
      try {
        const parsedUrls = JSON.parse(url);
        console.debug("⚠️ Обнаружена JSON-строка с массивом URL:", parsedUrls);
        if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
          // Рекурсивно вызываем normalizeUrl для первого элемента массива
          return this.normalizeUrl(parsedUrls[0]);
        }
      } catch (e) {
        // Если не удалось распарсить как JSON, продолжаем обработку как обычную строку
        console.debug("⚠️ Не удалось распарсить строку как JSON. Обрабатываем как обычную строку:", url);
      }
    }
    
    // Удаляем кавычки (если есть)
    let cleanUrl = url.replace(/^"+|"+$/g, '');
    
    // Возвращаем если это просто пустая строка
    if (!cleanUrl.trim()) return '';
    
    // НОВАЯ ПРОВЕРКА: Удаляем любые кавычки и слеши, которые могут быть в начале и конце строки
    // Это очень важно для случаев, когда URL хранится в JSON с экранированными слешами
    // или когда данные фотографий проекта приходят с какими-то арефактами
    cleanUrl = cleanUrl.replace(/^["'\/\\]+|["'\/\\]+$/g, '');
    
    // Если после очистки строка пустая, возвращаем пустую строку
    if (!cleanUrl.trim()) return '';
    
    // Если URL уже является абсолютным
    if (cleanUrl.startsWith('http')) {
      return cleanUrl;
    }
    
    // Если URL начинается с "/uploads" - наиболее распространенный случай для проектов
    if (cleanUrl.startsWith('/uploads')) {
      return cleanUrl;
    }
    
    // Если URL начинается с "uploads/" (без слеша в начале)
    if (cleanUrl.startsWith('uploads/')) {
      return `/${cleanUrl}`;
    }
    
    // Если URL начинается просто с имени файла или директории (без "uploads/")
    if (!cleanUrl.startsWith('/')) {
      // Проверяем, содержит ли URL слеш вообще
      if (cleanUrl.includes('/')) {
        // Если это какой-то другой путь, просто добавляем / в начало
        return `/${cleanUrl}`;
      } else {
        // Если это просто имя файла, добавляем путь к uploads
        return `/uploads/${cleanUrl}`;
      }
    }
    
    // Обрабатываем относительный путь
    return cleanUrl;
  }

  /**
   * Извлекает домен из URL
   * @param url URL для обработки
   * @returns Домен
   */
  private extractDomain(url: string): string {
    const match = url.match(this.domainRegex);
    return (match && match[1]) ? match[1] : '';
  }

  /**
   * Проверяет, является ли URL внешним (не с текущего домена)
   * @param url URL для проверки
   * @returns true если URL внешний
   */
  private isExternalUrl(url: string): boolean {
    if (!url) return false;
    if (!url.startsWith('http')) return false;
    
    // Получаем текущий домен
    const currentDomain = window.location.hostname;
    const urlDomain = this.extractDomain(url);
    
    return urlDomain !== currentDomain;
  }

  /**
   * Обработчик изменения статуса онлайн/офлайн
   * @param isOnline Статус подключения
   */
  private handleOnlineStatusChange(isOnline: boolean): void {
    if (isOnline) {
      console.log("🌐 Соединение восстановлено, перезагружаем проблемные изображения");
      
      // Удаляем из кэша все изображения с ошибками
      for (const [url, state] of this.cache.entries()) {
        if (state.error) {
          this.cache.delete(url);
          this.preloadImage(url);
        }
      }
    } else {
      console.log("📴 Соединение потеряно, изображения могут не загружаться");
    }
  }

  /**
   * Загружает изображение и возвращает Promise с элементом изображения
   * @param url URL изображения для загрузки
   * @returns Promise с HTMLImageElement
   */
  public loadImage(url: string): Promise<HTMLImageElement> {
    // Нормализуем URL
    const normalizedUrl = this.normalizeUrl(url);
    
    // Проверяем, есть ли промис загрузки в процессе
    if (this.loadPromises.has(normalizedUrl)) {
      return this.loadPromises.get(normalizedUrl)!;
    }
    
    // Проверяем кэш, если изображение уже загружено
    if (this.cache.has(normalizedUrl)) {
      const cachedState = this.cache.get(normalizedUrl)!;
      
      // Если изображение загружено успешно и у нас есть элемент, возвращаем его
      if (cachedState.loaded && !cachedState.error && cachedState.element) {
        return Promise.resolve(cachedState.element);
      }
      
      // Если была ошибка загрузки, попробуем еще раз только если прошло достаточно времени
      if (cachedState.error && (Date.now() - cachedState.timestamp > 300000)) { // 5 минут
        this.cache.delete(normalizedUrl);
      } else if (cachedState.error) {
        // Если недавно была ошибка, не пытаемся снова загрузить
        return Promise.reject(new Error(`Ошибка загрузки изображения: ${normalizedUrl}`));
      }
    }
    
    // Создаем новый промис для загрузки изображения
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      // Настраиваем обработчики событий
      img.onload = () => {
        // Сохраняем в кэш
        this.cache.set(normalizedUrl, {
          loaded: true,
          error: false,
          url: normalizedUrl,
          element: img,
          timestamp: Date.now()
        });
        
        // Удаляем промис из карты загрузок
        this.loadPromises.delete(normalizedUrl);
        
        resolve(img);
      };
      
      img.onerror = () => {
        // Сохраняем информацию об ошибке в кэш
        this.cache.set(normalizedUrl, {
          loaded: false,
          error: true,
          url: normalizedUrl,
          timestamp: Date.now()
        });
        
        // Удаляем промис из карты загрузок
        this.loadPromises.delete(normalizedUrl);
        
        reject(new Error(`Ошибка загрузки изображения: ${normalizedUrl}`));
      };
      
      // Начинаем загрузку
      img.src = normalizedUrl;
    });
    
    // Сохраняем промис в карте загрузок
    this.loadPromises.set(normalizedUrl, loadPromise);
    
    return loadPromise;
  }

  /**
   * Предзагружает изображение, но не блокирует выполнение
   * @param url URL изображения для предзагрузки или массив URL
   */
  public preloadImage(url: string | string[] | undefined | null): void {
    // Проверяем, является ли URL изображения валидным
    if (!url) {
      return;
    }
    
    // Обработка массива URL
    if (Array.isArray(url)) {
      url.forEach(urlItem => {
        if (urlItem) this.preloadImage(urlItem);
      });
      return;
    }
    
    // Если это не строка или пустая строка, ничего не делаем
    if (typeof url !== 'string' || url.trim() === '') {
      return;
    }
    
    // Проверка на JSON-строку с массивом
    if (url.startsWith('[') && url.endsWith(']')) {
      try {
        const parsedUrls = JSON.parse(url);
        if (Array.isArray(parsedUrls)) {
          parsedUrls.forEach(parsedUrl => {
            if (parsedUrl) this.preloadImage(parsedUrl);
          });
          return;
        }
      } catch (e) {
        // Если не удалось распарсить как JSON, продолжаем обработку как обычную строку
      }
    }
    
    // Нормализуем URL
    const normalizedUrl = this.normalizeUrl(url);
    
    // Если изображение уже загружено или загружается, ничего не делаем
    if (this.cache.has(normalizedUrl) || this.loadPromises.has(normalizedUrl)) {
      return;
    }
    
    // Если это внешний URL, не предзагружаем его
    if (this.isExternalUrl(normalizedUrl)) {
      return;
    }
    
    // Добавляем в очередь предзагрузки
    if (!this.preloadQueue.includes(normalizedUrl)) {
      this.preloadQueue.push(normalizedUrl);
      
      // Запускаем обработку очереди, если она еще не запущена
      if (!this.isProcessingQueue) {
        this.processPreloadQueue();
      }
    }
  }

  /**
   * Обрабатывает очередь предзагрузки изображений
   */
  private async processPreloadQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    while (this.preloadQueue.length > 0) {
      // Берем первые N элементов для одновременной загрузки
      const batchUrls = this.preloadQueue.splice(0, this.concurrentLoads);
      
      // Загружаем их параллельно
      const loadPromises = batchUrls.map(url => 
        this.loadImage(url).catch(() => {
          // Игнорируем ошибки при предзагрузке
        })
      );
      
      // Ждем, пока все загрузятся
      await Promise.all(loadPromises);
      
      // Если в очереди еще есть элементы, делаем небольшую паузу
      if (this.preloadQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Получает URL изображения из кэша или возвращает дефолтное
   * @param url URL изображения или массив URL
   * @param type Тип изображения (avatar, resume, project)
   * @returns URL изображения из кэша или дефолтное
   */
  public getImageUrl(url: string | string[] | undefined | null, type: 'avatar' | 'resume' | 'project' | 'default' = 'default'): string {
    // Получаем соответствующее дефолтное изображение
    const defaultImageForType = {
      'avatar': this.defaultAvatarImage,
      'resume': this.defaultResumeImage,
      'project': this.defaultProjectImage,
      'default': this.defaultImage
    }[type];
    
    // Если URL не указан, возвращаем дефолтное
    if (!url) {
      return defaultImageForType;
    }
    
    // Нормализуем URL
    const normalizedUrl = this.normalizeUrl(url);
    
    // ВАЖНЫЙ ФИХ: Всегда возвращаем исходный URL, чтобы React мог попытаться загрузить реальное изображение,
    // даже если оно не в кэше. Только если изображение явно не загрузилось, будет показано дефолтное
    return normalizedUrl;
  }

  /**
   * Предзагружает изображения из API
   */
  public async preloadFromApi(): Promise<void> {
    console.log("🚀 Начинаем предзагрузку изображений из API...");
    
    try {
      // Получаем ресурсы для предзагрузки
      const response = await fetch('/api/preload-resources');
      const data = await response.json();
      
      if (data.success && data.imageUrls) {
        console.log("✅ Получены данные для предзагрузки:", data.imageUrls.length, "изображений");
        
        // Подсчет по типам
        const stats = {
          "Пользователи": 0,
          "Проекты": 0,
          "Резюме": 0,
          "Всего уникальных": new Set(data.imageUrls).size
        };
        
        // Предзагружаем все URL
        data.imageUrls.forEach((url: string) => {
          // Считаем статистику
          if (url.includes('/users/')) stats["Пользователи"]++;
          if (url.includes('/projects/')) stats["Проекты"]++;
          if (url.includes('/resumes/')) stats["Резюме"]++;
          
          this.preloadImage(url);
        });
        
        console.log("📊 Статистика предзагрузки:", stats);
      }
    } catch (error) {
      console.error("❌ Ошибка при предзагрузке изображений:", error);
    }
  }

  /**
   * Очищает кэш от старых, неиспользуемых изображений
   * @param maxAge Максимальный возраст кэша в миллисекундах (по умолчанию 1 час)
   */
  public clearOldCache(maxAge: number = 3600000): void {
    const now = Date.now();
    
    // Удаляем из кэша устаревшие записи
    for (const [url, state] of this.cache.entries()) {
      if (now - state.timestamp > maxAge) {
        // Не удаляем дефолтные изображения
        if (url === this.defaultImage || 
            url === this.defaultAvatarImage || 
            url === this.defaultProjectImage || 
            url === this.defaultResumeImage) {
          continue;
        }
        this.cache.delete(url);
      }
    }
  }
}

export const imageService = ImageCache.getInstance();