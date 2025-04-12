/**
 * Сервис для управления изображениями
 * Предоставляет функционал для предзагрузки, кэширования и управления изображениями
 */

// Интерфейс для хранения состояния загрузки изображения
interface ImageState {
  loaded: boolean;
  error: boolean;
  url: string;
  element?: HTMLImageElement;
  timestamp: number;
}

// Кэш изображений для всего приложения
class ImageCache {
  private static instance: ImageCache;
  private cache: Map<string, ImageState> = new Map();
  private loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  private defaultImage: string = '/uploads/default-avatar-test.jpg';
  private preloadQueue: string[] = [];
  private isProcessingQueue: boolean = false;
  private concurrentLoads: number = 5; // Количество одновременных загрузок
  private domainRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/;
  private apiBasePaths = ['/api/users', '/api/projects', '/api/resumes', '/api/public'];
  
  private constructor() {
    // Инициализируем дефолтное изображение сразу
    this.loadImage(this.defaultImage).catch(() => {
      console.error('Не удалось загрузить дефолтное изображение');
    });
    
    // Логируем для отладки - это поможет понять, что происходит
    console.log('🖼️ ImageCache инициализирован, дефолтное изображение:', this.defaultImage);
    
    // Обработчик для офлайн/онлайн событий
    window.addEventListener('online', () => this.handleOnlineStatusChange(true));
    window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
  }
  
  // Получение экземпляра кэша (паттерн Singleton)
  public static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }
  
  /**
   * Нормализует URL изображения
   * @param url Исходный URL изображения
   * @returns Нормализованный URL
   */
  public normalizeUrl(url: string | undefined | null): string {
    if (!url) return this.defaultImage;
    
    // Удаляем лишние кавычки, которые могут быть в JSON строках
    url = url.replace(/^"(.*)"$/, '$1');
    
    // Если URL уже содержит протокол, возвращаем как есть
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Проверяем, не является ли URL относительным путем к uploads
    if (!url.startsWith('/')) {
      return `/uploads/${url.split('/').pop()}`;
    }
    
    return url;
  }
  
  /**
   * Извлекает домен из URL
   * @param url URL для обработки
   * @returns Домен
   */
  private extractDomain(url: string): string {
    const match = url.match(this.domainRegex);
    return match?.[1] || '';
  }
  
  /**
   * Проверяет, является ли URL внешним (не с текущего домена)
   * @param url URL для проверки
   * @returns true если URL внешний
   */
  private isExternalUrl(url: string): boolean {
    if (url.startsWith('/')) return false;
    
    const currentDomain = this.extractDomain(window.location.href);
    const urlDomain = this.extractDomain(url);
    
    return currentDomain !== urlDomain && urlDomain !== '';
  }
  
  /**
   * Обработчик изменения статуса онлайн/офлайн
   * @param isOnline Статус подключения
   */
  private handleOnlineStatusChange(isOnline: boolean): void {
    if (isOnline) {
      console.log('🌐 Восстановлено соединение, перезагружаем изображения с ошибками...');
      // Перезагружаем изображения, которые не удалось загрузить
      Array.from(this.cache.entries()).forEach(([url, state]) => {
        if (state.error) {
          this.cache.delete(url);
          this.preloadImage(url);
        }
      });
    }
  }
  
  /**
   * Загружает изображение и возвращает Promise с элементом изображения
   * @param url URL изображения для загрузки
   * @returns Promise с HTMLImageElement
   */
  public loadImage(url: string): Promise<HTMLImageElement> {
    const normalizedUrl = this.normalizeUrl(url);
    
    // Проверяем, есть ли уже загруженное изображение в кэше
    const cachedImage = this.cache.get(normalizedUrl);
    if (cachedImage && cachedImage.loaded && !cachedImage.error) {
      return Promise.resolve(cachedImage.element as HTMLImageElement);
    }
    
    // Проверяем, есть ли уже промис для этого URL
    const existingPromise = this.loadPromises.get(normalizedUrl);
    if (existingPromise) {
      return existingPromise;
    }
    
    // Создаем новый промис для загрузки изображения
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      // Устанавливаем обработчики событий
      img.onload = () => {
        // Обновляем кэш при успешной загрузке
        this.cache.set(normalizedUrl, {
          loaded: true,
          error: false,
          url: normalizedUrl,
          element: img,
          timestamp: Date.now()
        });
        this.loadPromises.delete(normalizedUrl);
        resolve(img);
      };
      
      img.onerror = () => {
        // Обновляем кэш с информацией об ошибке
        this.cache.set(normalizedUrl, {
          loaded: false,
          error: true,
          url: normalizedUrl,
          timestamp: Date.now()
        });
        this.loadPromises.delete(normalizedUrl);
        
        // Если это не дефолтное изображение, пробуем загрузить дефолтное
        if (normalizedUrl !== this.defaultImage) {
          console.warn(`Ошибка загрузки изображения: ${normalizedUrl}, использую дефолтное изображение`);
          this.loadImage(this.defaultImage)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error(`Не удалось загрузить изображение: ${normalizedUrl}`));
        }
      };
      
      // Для внешних URL устанавливаем crossOrigin
      if (this.isExternalUrl(normalizedUrl)) {
        img.crossOrigin = 'anonymous';
      }
      
      // Начинаем загрузку
      img.src = normalizedUrl;
    });
    
    // Сохраняем промис в кэше
    this.loadPromises.set(normalizedUrl, loadPromise);
    
    return loadPromise;
  }
  
  /**
   * Предзагружает изображение, но не блокирует выполнение
   * @param url URL изображения для предзагрузки
   */
  public preloadImage(url: string): void {
    const normalizedUrl = this.normalizeUrl(url);
    
    // Если изображение уже в кэше и загружено, ничего не делаем
    const cachedImage = this.cache.get(normalizedUrl);
    if (cachedImage && cachedImage.loaded && !cachedImage.error) {
      return;
    }
    
    // Если изображение уже в процессе загрузки, ничего не делаем
    if (this.loadPromises.has(normalizedUrl)) {
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
      // Берем пакет URL для параллельной загрузки
      const batch = this.preloadQueue.splice(0, this.concurrentLoads);
      
      // Загружаем пакет параллельно
      const promises = batch.map(url => this.loadImage(url).catch(() => {
        // Просто логируем ошибку, не прерываем загрузку других изображений
        console.warn(`Не удалось предзагрузить изображение: ${url}`);
      }));
      
      // Ждем завершения загрузки пакета
      await Promise.allSettled(promises);
      
      // Небольшая пауза между пакетами, чтобы не перегружать систему
      if (this.preloadQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.isProcessingQueue = false;
  }
  
  /**
   * Получает URL изображения из кэша или возвращает дефолтное
   * @param url URL изображения
   * @returns URL изображения из кэша или дефолтное
   */
  public getImageUrl(url: string): string {
    const normalizedUrl = this.normalizeUrl(url);
    const cachedImage = this.cache.get(normalizedUrl);
    
    // Для тестовой страницы изображений и вкладки Банкстер всегда возвращаем оригинальный URL
    // чтобы мы могли увидеть ошибки загрузки
    if (window.location.pathname === '/image-test') {
      console.log(`🧪 На тестовой странице: URL ${normalizedUrl} возвращается без фолбэка`);
      return normalizedUrl;
    }
    
    if (cachedImage && cachedImage.loaded && !cachedImage.error) {
      return normalizedUrl;
    }
    
    // Запускаем предзагрузку на будущее
    this.preloadImage(normalizedUrl);
    
    // Возвращаем дефолтное изображение пока не загрузится настоящее
    return this.defaultImage;
  }
  
  /**
   * Предзагружает изображения из API
   */
  public async preloadFromApi(): Promise<void> {
    try {
      console.log('🚀 Начинаем предзагрузку изображений из API...');
      
      // Сначала пробуем использовать специальный эндпоинт для предзагрузки
      try {
        const response = await fetch('/api/preload-resources');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
            console.log(`✅ Получены данные для предзагрузки: ${data.counts.total} изображений`);
            
            // Предзагружаем изображения
            data.imageUrls.forEach((url: string) => this.preloadImage(this.normalizeUrl(url)));
            
            // Подробная статистика
            console.log(`📊 Статистика предзагрузки:`, {
              'Пользователи': data.counts.users,
              'Проекты': data.counts.projects,
              'Резюме': data.counts.resumes,
              'Всего уникальных': data.counts.total
            });
            
            return; // Выходим, так как использовали специализированный эндпоинт
          }
        }
      } catch (e) {
        console.warn('Не удалось использовать специальный эндпоинт для предзагрузки:', e);
      }
      
      // Запасной вариант: параллельно запрашиваем данные из всех источников
      console.log('⚠️ Используем запасной метод предзагрузки изображений...');
      const fetchPromises = this.apiBasePaths.map(path => 
        fetch(path)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      );
      
      const results = await Promise.allSettled(fetchPromises);
      
      // Собираем URL изображений из всех ответов
      const imageUrls: Set<string> = new Set();
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          
          // Обрабатываем массивы данных
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              // Добавляем изображения пользователей
              if (item.avatar) {
                imageUrls.add(this.normalizeUrl(item.avatar));
              }
              
              // Добавляем изображения проектов
              if (item.photo) {
                imageUrls.add(this.normalizeUrl(item.photo));
              }
              
              // Если есть вложенные объекты с изображениями, обрабатываем их
              if (item.user && item.user.avatar) {
                imageUrls.add(this.normalizeUrl(item.user.avatar));
              }
            });
          }
          // Обрабатываем специальный формат от API предзагрузки
          else if (data.imageUrls && Array.isArray(data.imageUrls)) {
            data.imageUrls.forEach((url: string) => {
              imageUrls.add(this.normalizeUrl(url));
            });
          }
        }
      });
      
      // Предзагружаем все найденные изображения
      if (imageUrls.size > 0) {
        console.log(`🔍 Найдено ${imageUrls.size} изображений для предзагрузки`);
        Array.from(imageUrls).forEach(url => this.preloadImage(url));
      } else {
        console.log('⚠️ Не найдено изображений для предзагрузки в API');
        
        // Предзагружаем хотя бы дефолтное изображение
        this.preloadImage(this.defaultImage);
      }
      
    } catch (error) {
      console.error('Ошибка при предзагрузке изображений из API:', error);
      
      // В случае ошибки, хотя бы дефолтное изображение
      this.preloadImage(this.defaultImage);
    }
  }
  
  /**
   * Очищает кэш от старых, неиспользуемых изображений
   * @param maxAge Максимальный возраст кэша в миллисекундах (по умолчанию 1 час)
   */
  public clearOldCache(maxAge: number = 3600000): void {
    const now = Date.now();
    
    Array.from(this.cache.entries()).forEach(([url, state]) => {
      // Не очищаем дефолтное изображение
      if (url === this.defaultImage) {
        return;
      }
      
      // Удаляем старые записи
      if (now - state.timestamp > maxAge) {
        this.cache.delete(url);
      }
    });
  }
}

// Экспортируем единственный экземпляр кэша изображений
export const imageService = ImageCache.getInstance();