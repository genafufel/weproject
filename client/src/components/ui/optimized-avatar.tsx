import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

interface OptimizedAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  fallbackSrc?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function OptimizedAvatar({
  src,
  alt,
  fallback,
  fallbackSrc = '/uploads/default.jpg',
  className,
  size = 'md'
}: OptimizedAvatarProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);
  const [isLoading, setIsLoading] = useState(!!src);
  const [error, setError] = useState(false);

  // Определяем размер аватара
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  // Нормализация пути к изображению
  const normalizedSrc = src ? (
    src.startsWith('/uploads') ? src : `/uploads/${src.split('/').pop()}`
  ) : undefined;

  // Предзагрузка аватара
  useEffect(() => {
    if (!normalizedSrc) {
      setIsLoading(false);
      setError(true);
      return;
    }

    setImageSrc(normalizedSrc);
    const img = new Image();
    img.src = normalizedSrc;
    
    img.onload = () => {
      setIsLoading(false);
      setError(false);
    };
    
    img.onerror = () => {
      setIsLoading(false);
      setError(true);
      setImageSrc(fallbackSrc);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [normalizedSrc, fallbackSrc]);

  // Создаем инициалы для фоллбека
  const initials = fallback || (alt ? alt.split(' ').map(n => n[0]).join('').toUpperCase() : '?');

  return (
    <Avatar className={cn(sizeClasses[size], 'relative', className)}>
      {imageSrc && !error && (
        <div className={cn(
          "absolute inset-0 rounded-full overflow-hidden",
          isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"
        )}>
          <img
            src={imageSrc}
            alt={alt || "Avatar"}
            className="w-full h-full object-cover"
            onError={() => {
              setError(true);
              setImageSrc(fallbackSrc);
            }}
          />
        </div>
      )}
      {(isLoading || error) && (
        <AvatarFallback className={isLoading ? "animate-pulse" : ""}>
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}