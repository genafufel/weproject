import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { imageService } from '@/lib/image-service';
import { Skeleton } from '@/components/ui/skeleton';

interface EnhancedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onError'> {
  src: string;
  fallbackSrc?: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  loadingClassName?: string;
  enableSkeleton?: boolean;
  onLoadingComplete?: () => void;
  priority?: boolean;
}

/**
 * Улучшенный компонент изображения с предзагрузкой, кэшированием и обработкой ошибок
 */
export function EnhancedImage({
  src,
  fallbackSrc,
  alt = '',
  className,
  width,
  height,
  loadingClassName,
  enableSkeleton = true,
  onLoadingComplete,
  priority = false,
  ...props
}: EnhancedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const mountedRef = useRef<boolean>(true);
  
  useEffect(() => {
    // При монтировании компонента устанавливаем флаг
    mountedRef.current = true;
    
    // При размонтировании компонента сбрасываем флаг
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    // Сбрасываем состояние при изменении src
    setIsLoading(true);
    
    const normalizedSrc = imageService.normalizeUrl(src);
    const defaultSrc = fallbackSrc ? imageService.normalizeUrl(fallbackSrc) : '';
    
    // Немедленно устанавливаем изображение из кэша, если оно там есть
    setImageSrc(imageService.getImageUrl(normalizedSrc));
    
    // Загружаем изображение с высоким приоритетом, если указан приоритет
    const loadImagePromise = priority 
      ? imageService.loadImage(normalizedSrc) 
      : imageService.preloadImage(normalizedSrc);
    
    // Запускаем предзагрузку запасного изображения, если оно указано
    if (defaultSrc && defaultSrc !== normalizedSrc) {
      imageService.preloadImage(defaultSrc);
    }
    
    // Если установлен приоритет, ждем завершения загрузки для обновления UI
    if (priority && loadImagePromise instanceof Promise) {
      loadImagePromise
        .then((img) => {
          // Проверяем, что компонент всё еще смонтирован
          if (mountedRef.current) {
            setImageSrc(img.src);
            setIsLoading(false);
            if (onLoadingComplete) onLoadingComplete();
          }
        })
        .catch(() => {
          // В случае ошибки используем запасное изображение, если оно указано
          if (mountedRef.current) {
            if (defaultSrc) {
              setImageSrc(defaultSrc);
            }
            setIsLoading(false);
          }
        });
    }
  }, [src, fallbackSrc, priority, onLoadingComplete]);
  
  const handleLoad = () => {
    setIsLoading(false);
    if (onLoadingComplete) onLoadingComplete();
  };
  
  const combinedClassName = cn(
    className,
    isLoading && enableSkeleton ? loadingClassName : ''
  );
  
  // Визуальное отображение изображения
  return (
    <>
      {isLoading && enableSkeleton ? (
        <Skeleton
          className={cn(
            'rounded overflow-hidden',
            loadingClassName,
            width ? `w-[${width}px]` : 'w-full',
            height ? `h-[${height}px]` : 'h-auto'
          )}
          style={{ 
            width: width ? `${width}px` : '100%', 
            height: height ? `${height}px` : 'auto' 
          }}
        />
      ) : null}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity max-w-full',
          combinedClassName,
          isLoading && enableSkeleton ? 'opacity-0 absolute' : 'opacity-100'
        )}
        width={width}
        height={height}
        onLoad={handleLoad}
        {...props}
      />
    </>
  );
}