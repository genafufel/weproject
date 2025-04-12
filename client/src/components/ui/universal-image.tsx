import React, { useState, useEffect } from 'react';
import { imageService } from '@/lib/image-service';

interface UniversalImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  type?: 'avatar' | 'project' | 'resume' | 'default';
  onError?: () => void;
  onLoad?: () => void;
}

/**
 * Универсальный компонент изображения с обработкой ошибок и запасными изображениями
 */
export function UniversalImage({
  src,
  fallbackSrc,
  type = 'default',
  className = '',
  alt = '',
  onError,
  onLoad,
  ...props
}: UniversalImageProps) {
  // Используем различные дефолтные изображения в зависимости от типа
  const defaultImages = {
    avatar: '/uploads/default-avatar.jpg',
    project: '/uploads/default-project.jpg',
    resume: '/uploads/default-resume.jpg',
    default: '/uploads/default.jpg'
  };
  
  // Определяем fallback, если не передан явно
  const finalFallbackSrc = fallbackSrc || defaultImages[type];
  
  // Состояние для отслеживания ошибок загрузки
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  
  // Сбросить состояние при изменении src
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);
  
  // Функция для очистки путей от лишних кавычек
  const cleanPath = (path: string) => {
    if (typeof path !== 'string') return '';
    return path.replace(/^"+|"+$/g, '');
  };
  
  // Обработчик ошибки загрузки изображения
  const handleError = () => {
    if (!hasError) {
      console.warn(`Ошибка загрузки изображения: ${imgSrc}, переход на запасное: ${finalFallbackSrc}`);
      setImgSrc(finalFallbackSrc);
      setHasError(true);
      onError?.();
    }
  };
  
  // Обработчик успешной загрузки
  const handleLoad = () => {
    onLoad?.();
  };
  
  // Гарантируем, что у нас всегда будет изображение
  const renderImage = () => {
    const cleanSrc = cleanPath(imgSrc);
    
    return (
      <img
        src={cleanSrc}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    );
  };
  
  return renderImage();
}

/**
 * Аватар пользователя с круглой формой
 */
export function UserAvatar({
  src,
  className = '',
  size = 'md',
  ...props
}: UniversalImageProps & { size?: 'sm' | 'md' | 'lg' }) {
  // Определяем размеры для разных вариантов
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  return (
    <UniversalImage
      src={src}
      type="avatar"
      className={`rounded-full object-cover border-2 border-border ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}

/**
 * Изображение проекта с закругленными углами
 */
export function ProjectImage({
  src,
  className = '',
  ...props
}: UniversalImageProps) {
  return (
    <UniversalImage
      src={src}
      type="project"
      className={`rounded-md object-cover ${className}`}
      {...props}
    />
  );
}

/**
 * Изображение резюме с закругленными углами
 */
export function ResumeImage({
  src,
  className = '',
  ...props
}: UniversalImageProps) {
  return (
    <UniversalImage
      src={src}
      type="resume"
      className={`rounded-md object-cover ${className}`}
      {...props}
    />
  );
}