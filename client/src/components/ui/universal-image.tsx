import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { imageService } from "@/lib/image-service";

// Выделяем атрибут src в отдельный интерфейс, чтобы избежать конфликта типов
type ImgAttributes = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError' | 'onLoad'>;

interface UniversalImageProps extends ImgAttributes {
  src: string | string[];
  fallbackSrc?: string;
  type?: 'avatar' | 'project' | 'resume' | 'default';
  onError?: () => void;
  onLoad?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  priority?: boolean; // Добавлено: приоритетная загрузка для LCP
  lazyLoad?: boolean; // Добавлено: контроль ленивой загрузки
}

// Стандартные изображения для различных типов
const DEFAULT_IMAGES = {
  'avatar': '/uploads/default-avatar.jpg',
  'project': '/uploads/default-project.jpg',
  'resume': '/uploads/default-resume.jpg',
  'default': '/uploads/default.jpg'
};

/**
 * Универсальный компонент изображения с обработкой ошибок и запасными изображениями
 * Оптимизированный с использованием IntersectionObserver для ленивой загрузки
 * и кэширования через imageService
 */
export const UniversalImage = memo(function UniversalImage({
  src,
  alt,
  fallbackSrc,
  type = 'default',
  className,
  onError,
  onLoad,
  size = 'md',
  priority = false,
  lazyLoad = true,
  ...rest
}: UniversalImageProps) {
  // Получаем нормализованный URL через imageService
  const normalizedSrc = src ? imageService.normalizeUrl(src) : DEFAULT_IMAGES[type];
  
  const [imgSrc, setImgSrc] = useState<string>(normalizedSrc);
  const [isLoading, setIsLoading] = useState<boolean>(!!src && !priority);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(priority); // Если приоритетное, считаем сразу видимым
  
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Обработчик ошибки загрузки - используем useCallback для оптимизации
  const handleError = useCallback(() => {
    // Предотвращаем повторную обработку ошибки
    if (hasError) return;
    
    // Определяем какое изображение использовать при ошибке
    const errorFallbackImage = fallbackSrc || DEFAULT_IMAGES[type];
    
    // Устанавливаем запасное изображение
    setImgSrc(errorFallbackImage);
    setHasError(true);
    setIsLoading(false);
    
    // Вызываем пользовательский обработчик ошибки, если он передан
    if (onError) onError();
  }, [fallbackSrc, hasError, onError, type]);
  
  // Обработчик успешной загрузки
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    if (onLoad) onLoad();
  }, [onLoad]);

  // Функция для настройки IntersectionObserver
  useEffect(() => {
    // Если загрузка не ленивая или уже обработана, пропускаем
    if (!lazyLoad || priority || isVisible) {
      if (priority && !isVisible) setIsVisible(true);
      return;
    }
    
    // Создаем observer для отслеживания видимости
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          // Отключаем наблюдение после первого пересечения
          if (observerRef.current && imgRef.current) {
            observerRef.current.unobserve(imgRef.current);
          }
        }
      },
      { 
        rootMargin: '200px', // Предзагрузка изображений при приближении к вьюпорту 
        threshold: 0.1 
      }
    );
    
    observerRef.current = observer;
    
    // Начинаем наблюдение
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazyLoad, priority, isVisible]);
  
  // При изменении src или когда элемент становится видимым, обновляем изображение
  useEffect(() => {
    if (!src || !isVisible) return;
    
    const processedSrc = imageService.normalizeUrl(src);
    
    if (processedSrc) {
      setImgSrc(processedSrc);
      if (!priority) setIsLoading(true);
      setHasError(false);
      
      // Предзагружаем изображение (не блокирует выполнение)
      imageService.preloadImage(processedSrc);
    }
  }, [src, type, isVisible, priority]);
  
  // Для изображений с приоритетом добавляем fetchpriority="high"
  const priorityProps = priority ? { fetchpriority: "high" as const } : {};
  
  // Добавляем loading="lazy" для не-приоритетных изображений, если браузер поддерживает
  const loadingProps = (!priority && lazyLoad) ? { loading: "lazy" as const } : {};
  
  // Если изображение не попало в область видимости и не приоритетное, показываем placeholder
  if (lazyLoad && !isVisible && !priority) {
    return (
      <div
        ref={imgRef}
        className={cn("bg-gray-200 dark:bg-gray-800 animate-pulse", className)}
        style={{ aspectRatio: rest.width && rest.height ? `${rest.width}/${rest.height}` : 'auto' }}
        {...rest}
      />
    );
  }
  
  return (
    <img
      ref={imgRef}
      src={imgSrc}
      alt={alt || "Изображение"}
      className={cn(
        "transition-opacity",
        isLoading ? "opacity-0" : "opacity-100",
        className
      )}
      onError={handleError}
      onLoad={handleLoad}
      {...priorityProps}
      {...loadingProps}
      {...rest}
    />
  );
});

/**
 * Аватар пользователя с круглой формой
 */
export function UserAvatar({
  className,
  size = 'md',
  ...props
}: UniversalImageProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  }[size] || "h-10 w-10";
  
  return (
    <UniversalImage
      type="avatar"
      className={cn(
        "rounded-full object-cover border-2 border-gray-200 dark:border-gray-500",
        sizeClasses,
        className
      )}
      {...props}
    />
  );
}

/**
 * Изображение проекта с закругленными углами
 * Универсальная обработка различных форматов данных изображений
 */
export function ProjectImage({
  className,
  size = 'md',
  src,
  ...props
}: UniversalImageProps) {
  const sizeClasses = {
    sm: "h-32",
    md: "h-48",
    lg: "h-64",
    xl: "h-96",
  }[size] || "h-48";
  
  // Улучшенная обработка различных форматов данных изображений
  let processedSrc: string | string[] = src || '/uploads/default-project.jpg';
  
  // Шаг 1: Обрабатываем null и undefined
  if (processedSrc === null || processedSrc === undefined) {
    console.debug("⚠️ ProjectImage: Получен null или undefined, используем дефолтное изображение");
    processedSrc = '/uploads/default-project.jpg';
  }
  
  // Шаг 2: Обрабатываем JSON-строки
  if (typeof processedSrc === 'string') {
    try {
      const trimmedSrc = processedSrc.trim();
      
      // Проверяем, является ли строка JSON с массивом
      if (trimmedSrc.startsWith('[') && trimmedSrc.endsWith(']')) {
        try {
          const parsedData = JSON.parse(trimmedSrc);
          if (Array.isArray(parsedData)) {
            console.debug("🔄 ProjectImage: Преобразована JSON-строка в массив:", parsedData);
            processedSrc = parsedData.length > 0 ? parsedData : ['/uploads/default-project.jpg'];
          }
        } catch (error) {
          console.debug("⚠️ ProjectImage: Не удалось преобразовать строку в JSON:", processedSrc);
          // Если не удалось распарсить JSON, оставляем как есть
        }
      }
      
      // Если processedSrc все еще строка, проверяем, является ли она JSON-объектом
      if (typeof processedSrc === 'string' && trimmedSrc.startsWith('{') && trimmedSrc.endsWith('}')) {
        try {
          const parsedObject = JSON.parse(trimmedSrc);
          console.debug("🔄 ProjectImage: Обрабатываем JSON-объект:", parsedObject);
          
          // Если у объекта есть свойство url, images или image, используем его
          if (parsedObject.url) {
            processedSrc = parsedObject.url;
          } else if (parsedObject.images && Array.isArray(parsedObject.images)) {
            processedSrc = parsedObject.images.length > 0 ? parsedObject.images[0] : '/uploads/default-project.jpg';
          } else if (parsedObject.image) {
            processedSrc = parsedObject.image;
          }
        } catch (error) {
          console.debug("⚠️ ProjectImage: Не удалось преобразовать строку в JSON-объект:", processedSrc);
          // Оставляем как есть
        }
      }
    } catch (error: any) {
      console.debug("⚠️ ProjectImage: Ошибка при обработке строки:", error?.message || 'Неизвестная ошибка');
      // Если возникла ошибка при вызове строковых методов, установим значение по умолчанию
      processedSrc = '/uploads/default-project.jpg';
    }
  }
  
  // Шаг 3: Обрабатываем массивы
  if (Array.isArray(processedSrc)) {
    if (processedSrc.length > 0) {
      console.debug("🔄 ProjectImage: Использован первый элемент из массива:", processedSrc);
      
      // Дополнительная проверка, является ли первый элемент массива валидным
      const firstItem = processedSrc[0];
      if (firstItem === null || firstItem === undefined || firstItem === '') {
        processedSrc = '/uploads/default-project.jpg';
      } else {
        processedSrc = firstItem;
      }
    } else {
      console.debug("⚠️ ProjectImage: Получен пустой массив, используем дефолтное изображение");
      processedSrc = '/uploads/default-project.jpg';
    }
  }
  
  // Шаг 4: Финальная проверка на пустую строку
  if (typeof processedSrc === 'string') {
    try {
      if (processedSrc.trim() === '') {
        console.debug("⚠️ ProjectImage: Получена пустая строка, используем дефолтное изображение");
        processedSrc = '/uploads/default-project.jpg';
      }
    } catch (error: any) {
      console.debug("⚠️ ProjectImage: Ошибка при проверке пустой строки:", error?.message || 'Неизвестная ошибка');
      processedSrc = '/uploads/default-project.jpg';
    }
  }
  
  return (
    <UniversalImage
      type="project"
      className={cn(
        "rounded-md object-cover w-full",
        sizeClasses,
        className
      )}
      src={processedSrc}
      {...props}
    />
  );
}

/**
 * Изображение резюме с закругленными углами
 */
export function ResumeImage({
  className,
  size = 'md',
  ...props
}: UniversalImageProps) {
  const sizeClasses = {
    sm: "h-32",
    md: "h-48",
    lg: "h-64",
    xl: "h-96",
  }[size] || "h-48";
  
  return (
    <UniversalImage
      type="resume"
      className={cn(
        "rounded-md object-cover w-full",
        sizeClasses,
        className
      )}
      {...props}
    />
  );
}