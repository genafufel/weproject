import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TestAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  priority?: boolean;
}

/**
 * Простой компонент аватара для тестовой страницы без кэширования и фолбэков
 */
export function TestAvatar({
  src,
  alt = 'Аватар пользователя',
  fallback,
  className,
  size = 'md',
  priority = false,
}: TestAvatarProps) {
  const [error, setError] = useState<boolean>(false);

  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  // Нормализуем URL изображения
  const normalizedSrc = src && src.startsWith('/') && !src.startsWith('//') 
    ? `${window.location.origin}${src}`
    : src;

  console.log(`🧪 На тестовой странице: аватар ${src} загружается напрямую`);

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

  return (
    <Avatar className={cn(sizeClasses[size], className, error ? 'border-2 border-red-500' : '')}>
      {src && !error ? (
        <AvatarImage 
          src={normalizedSrc}
          alt={alt}
          onError={() => {
            setError(true);
            console.error(`❌ Ошибка загрузки аватара: ${src}`);
          }}
        />
      ) : null}
      <AvatarFallback>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}