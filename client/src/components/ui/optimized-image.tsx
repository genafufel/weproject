import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { imagePreloader } from '@/lib/image-preloader';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  placeholderColor?: string;
  onLoadingComplete?: () => void;
  priority?: boolean; // Добавлен параметр приоритета
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc = '/uploads/default.jpg',
  placeholderColor = '#f3f4f6',
  onLoadingComplete,
  priority = false, // По умолчанию false
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(false);

  // При инициализации компонента предзагружаем изображение
  useEffect(() => {
    mountedRef.current = true;
    
    // Преждевременно выходим, если нет src
    if (!src) {
      if (mountedRef.current) {
        setIsLoading(false);
        setError(true);
      }
      return;
    }
    
    // Проверяем, есть ли изображение в кэше
    if (imagePreloader.has(src)) {
      if (mountedRef.current) {
        setIsLoading(false);
        setError(false);
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }
      return;
    }
    
    // Если изображения нет в кэше, загружаем его
    // Отправляем в очередь предзагрузки с указанным приоритетом
    imagePreloader.preload(src, priority);
    
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      if (mountedRef.current) {
        setIsLoading(false);
        setError(false);
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }
    };
    
    img.onerror = () => {
      if (mountedRef.current) {
        setIsLoading(false);
        setError(true);
        if (fallbackSrc) {
          setImageSrc(fallbackSrc);
        }
        
        // Если основное изображение не загрузилось, попробуем загрузить fallback
        if (fallbackSrc) {
          imagePreloader.preload(fallbackSrc, true);
        }
      }
    };

    return () => {
      mountedRef.current = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc, onLoadingComplete, priority]);

  // Обновляем состояние при изменении src
  useEffect(() => {
    if (src !== imageSrc) {
      setIsLoading(true);
      setError(false);
      setImageSrc(src);
    }
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden", className)} style={{
      backgroundColor: isLoading ? placeholderColor : 'transparent',
    }}>
      <img
        src={error && fallbackSrc ? fallbackSrc : imageSrc}
        alt={alt || "Image"}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          props.width ? "w-auto" : "w-full",
        )}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
          <span className="sr-only">Загрузка...</span>
        </div>
      )}
    </div>
  );
}