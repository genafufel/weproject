import React, { useState, useEffect } from "react";
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
 * Использует imageService для нормализации URL и кэширования
 */
export function UniversalImage({
  src,
  alt,
  fallbackSrc,
  type = 'default',
  className,
  onError,
  onLoad,
  size = 'md',
  ...rest
}: UniversalImageProps) {
  // Получаем нормализованный URL через imageService
  const normalizedSrc = src ? imageService.normalizeUrl(src) : DEFAULT_IMAGES[type];
  
  const [imgSrc, setImgSrc] = useState<string>(normalizedSrc);
  const [isLoading, setIsLoading] = useState<boolean>(!!src);
  const [hasError, setHasError] = useState<boolean>(false);
  
  // При изменении src, обновляем изображение
  useEffect(() => {
    if (!src) return;
    
    // Логгируем для отладки исходный URL
    console.debug(`👁️ UniversalImage: обработка исходного URL [${type}]:`, src);
    
    const processedSrc = imageService.normalizeUrl(src);
    console.debug(`👁️ UniversalImage: нормализованный URL:`, processedSrc);
    
    if (processedSrc) {
      setImgSrc(processedSrc);
      setIsLoading(true);
      setHasError(false);
      
      // Предзагружаем изображение (не блокирует выполнение)
      imageService.preloadImage(processedSrc);
    }
  }, [src, type]);
  
  // Обработчик ошибки загрузки
  const handleError = () => {
    // Предотвращаем повторную обработку ошибки
    if (hasError) return;
    
    // Определяем какое изображение использовать при ошибке
    let errorFallbackImage;
    
    if (fallbackSrc) {
      errorFallbackImage = fallbackSrc;
    } else {
      errorFallbackImage = DEFAULT_IMAGES[type];
    }
    
    // Устанавливаем запасное изображение
    setImgSrc(errorFallbackImage);
    setHasError(true);
    setIsLoading(false);
    
    // Вызываем пользовательский обработчик ошибки, если он передан
    if (onError) {
      onError();
    }
  };
  
  // Обработчик успешной загрузки
  const handleLoad = () => {
    setIsLoading(false);
    
    if (onLoad) {
      onLoad();
    }
  };
  
  return (
    <img
      src={imgSrc}
      alt={alt || "Изображение"}
      className={cn(
        "transition-opacity",
        isLoading ? "opacity-0" : "opacity-100",
        className
      )}
      onError={handleError}
      onLoad={handleLoad}
      {...rest}
    />
  );
}

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
  let processedSrc: string | string[] | null = src;
  
  // Шаг 1: Обрабатываем null и undefined
  if (processedSrc === null || processedSrc === undefined) {
    console.debug("⚠️ ProjectImage: Получен null или undefined, используем дефолтное изображение");
    processedSrc = '/uploads/default-project.jpg';
  }
  
  // Шаг 2: Обрабатываем JSON-строки
  if (typeof processedSrc === 'string') {
    // Проверяем, является ли строка JSON с массивом
    if (processedSrc.trim().startsWith('[') && processedSrc.trim().endsWith(']')) {
      try {
        const parsedData = JSON.parse(processedSrc);
        if (Array.isArray(parsedData)) {
          console.debug("🔄 ProjectImage: Преобразована JSON-строка в массив:", parsedData);
          processedSrc = parsedData.length > 0 ? parsedData : ['/uploads/default-project.jpg'];
        }
      } catch (error) {
        console.debug("⚠️ ProjectImage: Не удалось преобразовать строку в JSON:", processedSrc);
        // Если не удалось распарсить JSON, оставляем как есть
      }
    }
    
    // Проверяем, является ли строка JSON-объектом (например, {url: "..."})
    if (processedSrc.trim().startsWith('{') && processedSrc.trim().endsWith('}')) {
      try {
        const parsedObject = JSON.parse(processedSrc);
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
  if (typeof processedSrc === 'string' && processedSrc.trim() === '') {
    console.debug("⚠️ ProjectImage: Получена пустая строка, используем дефолтное изображение");
    processedSrc = '/uploads/default-project.jpg';
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