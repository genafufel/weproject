import React, { useState, useEffect } from "react";
import { imageService } from "@/lib/image-service";
import { cn } from "@/lib/utils";

interface UniversalImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  type?: 'avatar' | 'project' | 'resume' | 'default';
  onError?: () => void;
  onLoad?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Универсальный компонент изображения с обработкой ошибок и запасными изображениями
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
  const [imgSrc, setImgSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  
  useEffect(() => {
    // Сразу отображаем исходное изображение, даже если сервис еще не инициализирован
    let initialSrc = src;
    
    // Нормализуем путь, если это локальный путь
    if (src && typeof src === 'string' && !src.startsWith('http') && !src.startsWith('/uploads/')) {
      initialSrc = `/uploads/${src}`;
    }
    
    // Устанавливаем исходное изображение сразу
    setImgSrc(initialSrc);
    
    // Затем получаем оптимизированный URL из сервиса (для кэширования)
    const optimizedSrc = imageService.getImageUrl(src, type);
    if (optimizedSrc !== initialSrc) {
      setImgSrc(optimizedSrc);
    }

    setIsLoading(true);
    setHasError(false);
  }, [src, type]);
  
  const handleError = () => {
    console.warn("Ошибка загрузки изображения:", src, imgSrc);
    
    // Пробуем загрузить исходное изображение напрямую, игнорируя кэш
    const rawSrc = src;
    if (imgSrc !== rawSrc && !hasError) {
      console.log("Попытка загрузки исходного изображения:", rawSrc);
      setImgSrc(rawSrc);
      setHasError(true);
      return;
    }
    
    // Если есть fallbackSrc, используем его
    if (fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      // Иначе используем запасной вариант по типу
      const defaultSrc = {
        'avatar': '/uploads/default-avatar.jpg',
        'project': '/uploads/default-project.jpg',
        'resume': '/uploads/default-resume.jpg',
        'default': '/uploads/default.jpg'
      }[type];
      
      setImgSrc(defaultSrc);
    }
    
    // Вызываем обработчик ошибки, если он передан
    if (onError) {
      onError();
    }
  };
  
  const handleLoad = () => {
    setIsLoading(false);
    
    // Вызываем обработчик загрузки, если он передан
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