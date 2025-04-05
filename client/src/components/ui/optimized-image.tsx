import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  placeholderColor?: string;
  onLoadingComplete?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc = '/uploads/default.jpg',
  placeholderColor = '#f3f4f6',
  onLoadingComplete,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Простая предзагрузка изображения без сложной логики
  useEffect(() => {
    // Сбрасываем состояние при изменении src
    if (src !== imageSrc) {
      setIsLoading(true);
      setError(false);
      setImageSrc(src);
    }

    if (!src) {
      setIsLoading(false);
      setError(true);
      return;
    }

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setIsLoading(false);
      setError(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    };
    
    img.onerror = () => {
      setIsLoading(false);
      setError(true);
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
      }
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc, onLoadingComplete, imageSrc]);

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