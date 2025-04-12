import React from 'react';

interface DirectImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * Максимально простой компонент для отображения изображения с фолбеком
 */
export const DirectImage: React.FC<DirectImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = '/uploads/default-project.jpg',
}) => {
  // Отладочная информация
  console.log(`DirectImage: Отображение изображения с src=${src}`);
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        console.log(`DirectImage: Ошибка загрузки изображения ${src}, переключаюсь на запасное`);
        e.currentTarget.src = fallbackSrc;
      }}
    />
  );
};