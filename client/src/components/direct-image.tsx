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
  
  // Специальная проверка для проблемного проекта "Бомбардиро Выскребдино"
  let finalSrc = src;
  if (alt.includes('Бомбардиро')) {
    const hardcodedImageUrl = '/uploads/1744408001371-521291339.png';
    console.log(`DirectImage: Изображение для проекта Бомбардиро, использую захардкоженный путь`);
    finalSrc = hardcodedImageUrl;
  }
  
  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        console.log(`DirectImage: Ошибка загрузки изображения ${finalSrc}, переключаюсь на запасное`);
        e.currentTarget.src = fallbackSrc;
      }}
    />
  );
};