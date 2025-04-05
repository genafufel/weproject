import React, { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TestImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onError'> {
  src: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  loadingClassName?: string;
  enableSkeleton?: boolean;
  priority?: boolean;
}

/**
 * Простой компонент для тестирования изображений без кэширования и фолбэков
 */
export function TestImage({
  src,
  alt = '',
  className,
  width,
  height,
  loadingClassName,
  enableSkeleton = true,
  priority = false,
  ...props
}: TestImageProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Нормализуем URL изображения
  const normalizedSrc = src.startsWith('/') && !src.startsWith('//') 
    ? `${window.location.origin}${src}`
    : src;

  console.log(`🧪 На тестовой странице: URL ${src} загружается напрямую без кэша и фолбэков`);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
    console.error(`❌ Ошибка загрузки изображения: ${src}`);
  };

  const combinedClassName = cn(
    className,
    isLoading && enableSkeleton ? loadingClassName : ''
  );

  return (
    <div className="relative">
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
        src={normalizedSrc}
        alt={alt}
        className={cn(
          'transition-opacity max-w-full',
          combinedClassName,
          isLoading && enableSkeleton ? 'opacity-0 absolute' : 'opacity-100',
          error ? 'border-2 border-red-500' : ''
        )}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-70 text-red-700 text-sm p-2 text-center">
          Ошибка загрузки изображения
        </div>
      )}
    </div>
  );
}