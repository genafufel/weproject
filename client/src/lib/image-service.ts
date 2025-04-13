interface ImageState {
  loaded: boolean;
  error: boolean;
  url: string;
  element?: HTMLImageElement;
  timestamp: number;
  width?: number;  // Добавлены размеры изображения
  height?: number; // для оптимизации рендеринга
}

/**
 * Класс для кэширования и работы с изображениями
 * Оптимизирован для:
 * - Более эффективной предзагрузки
 * - Улучшенной обработки ошибок
 * - Приоритизации изображений в видимой области 
 * - Поддержки Largest Contentful Paint метрик
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
  private priorityQueue: string[] = []; // Очередь приоритетных изображений
  private isProcessingQueue: boolean = false;
  private isProcessingPriorityQueue: boolean = false;
  private concurrentLoads: number = 4; // Уменьшено для более стабильной загрузки
  private domainRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/;
  private apiBasePaths = ['/api/users', '/api/projects', '/api/resumes', '/api/public'];
  private cachePrefix = 'img_cache_v2_'; // Префикс для IndexedDB хранилища
  private storageAvailable: boolean = false;
  private db: IDBDatabase | null = null;

  private constructor() {
    // Проверяем наличие браузерного окружения (для SSR-совместимости)
    if (typeof window !== 'undefined') {
      // Проверяем доступность IndexedDB для хранения изображений
      this.initStorage().then(available => {
        this.storageAvailable = available;
        
        // Инициализируем дефолтные изображения
        this.preloadDefaultImages();
        
        // Загружаем кэш из IndexedDB если доступно
        if (this.storageAvailable) {
          this.loadCacheFromStorage();
        }
        
        // Запускаем очистку кэша по таймеру, реже для экономии ресурсов
        setInterval(() => this.clearOldCache(), 7200000); // Раз в 2 часа
        
        // Запускаем предзагрузку при загрузке страницы с задержкой
        // чтобы не создавать нагрузку при первоначальном рендеринге
        console.log("🚀 Запускаем предзагрузку изображений при загрузке страницы");
        setTimeout(() => {
          this.preloadFromApi();
        }, 5000); // Увеличено до 5 секунд для лучшей производительности LCP
      }).catch(() => {
        // Продолжаем работу даже без хранилища
        this.preloadDefaultImages();
      });
      
      // Обработчики состояния онлайн/офлайн
      window.addEventListener('online', () => this.handleOnlineStatusChange(true));
      window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
      
      // Слушаем события видимости страницы для оптимизации загрузки
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      
      // Используем Network Information API для адаптации к скорости сети
      this.setupNetworkListener();
    }
  }

  /**
   * Инициализирует хранилище IndexedDB для кэширования изображений
   */
  private async initStorage(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      try {
        const request = indexedDB.open('ImageCache', 1);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          // Создаем хранилище объектов для изображений
          if (!db.objectStoreNames.contains('images')) {
            const store = db.createObjectStore('images', { keyPath: 'url' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        
        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(true);
        };
        
        request.onerror = () => {
          console.warn("⚠️ IndexedDB недоступен для кэширования изображений");
          resolve(false);
        };
      } catch (error) {
        console.warn("⚠️ Ошибка при инициализации IndexedDB:", error);
        resolve(false);
      }
    });
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
   * Предзагрузка дефолтных изображений с высоким приоритетом
   */
  private preloadDefaultImages(): void {
    // Добавляем все дефолтные изображения в приоритетную очередь
    this.addToPriorityQueue(this.defaultImage);
    this.addToPriorityQueue(this.defaultAvatarImage);
    this.addToPriorityQueue(this.defaultProjectImage);
    this.addToPriorityQueue(this.defaultResumeImage);
    
    // Запускаем обработку приоритетной очереди
    this.processPriorityQueue();
  }
  
  /**
   * Загружает сохранённый кэш из IndexedDB
   */
  private async loadCacheFromStorage(): Promise<void> {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const items = request.result;
        
        // Восстанавливаем кэш из хранилища
        items.forEach(item => {
          // Проверяем, не устарело ли изображение (старше 7 дней)
          if (Date.now() - item.timestamp < 7 * 24 * 60 * 60 * 1000) {
            this.cache.set(item.url, {
              loaded: true,
              error: false,
              url: item.url,
              timestamp: item.timestamp,
              width: item.width,
              height: item.height
            });
          }
        });
        
        console.log(`✅ Загружено ${this.cache.size} изображений из IndexedDB`);
      };
    } catch (error) {
      console.warn("⚠️ Ошибка при загрузке из IndexedDB:", error);
    }
  }
  
  /**
   * Обработчик изменения видимости страницы
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // Когда страница видима, возобновляем загрузку
      this.processPriorityQueue();
      this.processPreloadQueue();
    } else {
      // Когда страница скрыта, не загружаем ничего, кроме приоритетных изображений
      // (это оставляем решать браузеру)
    }
  }
  
  /**
   * Настраивает слушатель для Network Information API
   */
  private setupNetworkListener(): void {
    // @ts-ignore - Используем Network Information API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      // Адаптируем параметры в зависимости от типа соединения
      const updateConnectionParams = () => {
        const type = connection.type;
        const effectiveType = connection.effectiveType;
        
        // Настраиваем параметры загрузки в зависимости от скорости сети
        if (type === 'cellular' || effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.concurrentLoads = 2; // Медленное соединение
        } else if (effectiveType === '3g') {
          this.concurrentLoads = 3; // Среднее соединение
        } else {
          this.concurrentLoads = 4; // Быстрое соединение
        }
      };
      
      // Обновляем параметры при изменении соединения
      connection.addEventListener('change', updateConnectionParams);
      updateConnectionParams();
    }
  }

  /**
   * Добавляет URL в приоритетную очередь загрузки
   * @param url URL для приоритетной загрузки
   */
  private addToPriorityQueue(url: string): void {
    const normalizedUrl = this.normalizeUrl(url);
    
    // Если URL уже в кэше или в очереди, пропускаем
    if (this.cache.has(normalizedUrl) || 
        this.loadPromises.has(normalizedUrl) || 
        this.priorityQueue.includes(normalizedUrl)) {
      return;
    }
    
    // Добавляем в приоритетную очередь и запускаем процесс загрузки
    this.priorityQueue.push(normalizedUrl);
    
    if (!this.isProcessingPriorityQueue) {
      this.processPriorityQueue();
    }
  }
  
  /**
   * Обрабатывает приоритетную очередь загрузки изображений
   */
  private async processPriorityQueue(): Promise<void> {
    if (this.isProcessingPriorityQueue || this.priorityQueue.length === 0) {
      return;
    }
    
    this.isProcessingPriorityQueue = true;
    
    // Загружаем все приоритетные изображения
    while (this.priorityQueue.length > 0) {
      const url = this.priorityQueue.shift()!;
      try {
        await this.loadImage(url);
      } catch (error) {
        // Игнорируем ошибки для приоритетной загрузки
      }
    }
    
    this.isProcessingPriorityQueue = false;
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