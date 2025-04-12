import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface UniversalImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  type?: 'avatar' | 'project' | 'resume' | 'default';
  onError?: () => void;
  onLoad?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Функция для нормализации URL изображения
function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  if (typeof url !== 'string') {
    return '';
  }
  
  // Удаляем кавычки (если есть)
  let cleanUrl = url.replace(/^"+|"+$/g, '');
  
  // Возвращаем если это просто пустая строка
  if (!cleanUrl.trim()) return '';
  
  // Если URL уже является абсолютным или начинается с "/uploads"
  if (cleanUrl.startsWith('http') || cleanUrl.startsWith('/uploads')) {
    return cleanUrl;
  }
  
  // Если URL начинается с "uploads/" (без слеша в начале)
  if (cleanUrl.startsWith('uploads/')) {
    return `/${cleanUrl}`;
  }
  
  // Если URL не начинается со слеша, считаем что это файл в uploads
  if (!cleanUrl.startsWith('/')) {
    return `/uploads/${cleanUrl}`;
  }
  
  return cleanUrl;
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
  
  // Стандартные изображения для различных типов
  const defaultSrcMap = {
    'avatar': '/uploads/default-avatar.jpg',
    'project': '/uploads/default-project.jpg',
    'resume': '/uploads/default-resume.jpg',
    'default': '/uploads/default.jpg'
  };
  
  useEffect(() => {
    // Нормализуем URL изображения при каждом изменении src
    const normalizedSrc = normalizeImageUrl(src);
    setImgSrc(normalizedSrc);
    setIsLoading(true);
    setHasError(false);
  }, [src]);
  
  const handleError = () => {
    console.warn("Ошибка загрузки изображения:", src);
    
    // Если есть пользовательский fallbackSrc, используем его
    if (fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      // Иначе используем запасное изображение по типу
      setImgSrc(defaultSrcMap[type]);
    }
    
    setHasError(true);
    
    // Вызываем пользовательский обработчик ошибки, если он передан
    if (onError) {
      onError();
    }
  };
  
  const handleLoad = () => {
    setIsLoading(false);
    
    // Вызываем пользовательский обработчик загрузки, если он передан
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