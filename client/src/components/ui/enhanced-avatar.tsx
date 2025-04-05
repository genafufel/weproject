import React, { useEffect, useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { imageService } from '@/lib/image-service';

interface EnhancedAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  fallbackSrc?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  priority?: boolean;
}

/**
 * Улучшенный компонент аватара с предзагрузкой и кэшированием
 */
export function EnhancedAvatar({
  src,
  alt = 'Аватар пользователя',
  fallback,
  fallbackSrc,
  className,
  size = 'md',
  priority = false,
}: EnhancedAvatarProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  // Рассчитываем инициалы из альтернативного текста или имени пользователя
  const getInitials = (): string => {
    if (!fallback && !alt) return '';
    
    const text = fallback || alt;
    const words = text.trim().split(' ');
    
    if (words.length === 1) {
      return text.charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    
    if (!src) {
      setIsLoading(false);
      setError(true);
      return;
    }
    
    const normalizedSrc = imageService.normalizeUrl(src);
    const defaultSrc = fallbackSrc ? imageService.normalizeUrl(fallbackSrc) : '';
    
    // Немедленно устанавливаем изображение из кэша, если оно там есть
    setImageSrc(imageService.getImageUrl(normalizedSrc));
    
    if (priority) {
      // Загружаем изображение с высоким приоритетом
      imageService.loadImage(normalizedSrc)
        .then((img) => {
          setImageSrc(img.src);
          setIsLoading(false);
        })
        .catch(() => {
          setError(true);
          setIsLoading(false);
          
          // Если есть fallbackSrc, пробуем его
          if (defaultSrc) {
            imageService.loadImage(defaultSrc)
              .then((img) => {
                setImageSrc(img.src);
                setError(false);
              })
              .catch(() => {
                // Оставляем ошибку, будут показаны инициалы
              });
          }
        });
    } else {
      // Предзагружаем изображение без блокировки
      imageService.preloadImage(normalizedSrc);
      if (defaultSrc) {
        imageService.preloadImage(defaultSrc);
      }
      
      // Устанавливаем небольшую задержку, чтобы дать шанс изображению загрузиться из кэша
      setTimeout(() => {
        setIsLoading(false);
      }, 50);
    }
  }, [src, fallbackSrc, priority]);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {!error ? (
        <AvatarImage 
          src={imageSrc}
          alt={alt}
          className={cn(isLoading ? 'opacity-0' : 'opacity-100')}
          onError={() => setError(true)}
        />
      ) : null}
      <AvatarFallback 
        className={cn(
          !error && !isLoading ? 'opacity-0' : 'opacity-100',
          'transition-opacity'
        )}
      >
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}