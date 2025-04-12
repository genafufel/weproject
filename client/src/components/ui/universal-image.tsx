import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { imageService } from "@/lib/image-service";

interface UniversalImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
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
    
    const processedSrc = imageService.normalizeUrl(src);
    if (processedSrc) {
      setImgSrc(processedSrc);
      setIsLoading(true);
      setHasError(false);
      
      // Предзагружаем изображение (не блокирует выполнение)
      imageService.preloadImage(processedSrc);
    }
  }, [src]);
  
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
 */
export function ProjectImage({
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
      type="project"
      className={cn(
        "rounded-md object-cover w-full",
        sizeClasses,
        className
      )}
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