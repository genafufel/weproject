import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { imagePreloader } from '@/lib/image-preloader';

interface OptimizedAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  fallbackSrc?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
}

export function OptimizedAvatar({
  src,
  alt,
  fallback,
  fallbackSrc = '/uploads/default.jpg',
  className,
  size = 'md',
  priority = true // Аватары загружаем с высоким приоритетом по умолчанию
}: OptimizedAvatarProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);
  const [isLoading, setIsLoading] = useState(!!src);
  const [error, setError] = useState(false);
  const mountedRef = useRef(false);

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

  // Предзагрузка аватара с использованием сервиса предзагрузки
  useEffect(() => {
    mountedRef.current = true;
    
    if (!normalizedSrc) {
      if (mountedRef.current) {
        setIsLoading(false);
        setError(true);
      }
      return;
    }

    setImageSrc(normalizedSrc);
    
    // Проверяем, есть ли аватар в кэше
    if (imagePreloader.has(normalizedSrc)) {
      if (mountedRef.current) {
        setIsLoading(false);
        setError(false);
      }
      return;
    }
    
    // Если аватара нет в кэше, загружаем его через сервис предзагрузки
    imagePreloader.preload(normalizedSrc, priority);
    
    const img = new Image();
    img.src = normalizedSrc;
    
    img.onload = () => {
      if (mountedRef.current) {
        setIsLoading(false);
        setError(false);
      }
    };
    
    img.onerror = () => {
      if (mountedRef.current) {
        setIsLoading(false);
        setError(true);
        setImageSrc(fallbackSrc);
        
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
  }, [normalizedSrc, fallbackSrc, priority]);

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