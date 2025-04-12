import React from 'react';
import { cn } from '@/lib/utils';
import { DirectImage } from './direct-image';

interface SimplifiedProjectImageProps extends React.HTMLAttributes<HTMLDivElement> {
  photos: any; // Любой формат данных для фото
  alt?: string;
  className?: string;
}

/**
 * Максимально упрощенный компонент для отображения изображений проектов
 */
export function SimplifiedProjectImage({
  photos,
  alt = "Project image",
  className,
  ...props
}: SimplifiedProjectImageProps) {
  // Получаем URL для изображения простым способом
  let imageUrl = '/uploads/default-project.jpg';

  // Отладочная информация
  console.log(`SimplifiedProjectImage: тип photos = ${typeof photos}, значение = ${JSON.stringify(photos)}`);

  try {
    // Если photos - массив с элементами
    if (Array.isArray(photos) && photos.length > 0) {
      imageUrl = photos[0];
      console.log(`SimplifiedProjectImage: используем первый элемент массива: ${imageUrl}`);
    }
    // Если photos - строка, похожая на JSON
    else if (typeof photos === 'string' && photos.startsWith('[') && photos.endsWith(']')) {
      try {
        const parsed = JSON.parse(photos);
        if (Array.isArray(parsed) && parsed.length > 0) {
          imageUrl = parsed[0];
          console.log(`SimplifiedProjectImage: используем первый элемент из JSON строки: ${imageUrl}`);
        }
      } catch (e) {
        console.log(`SimplifiedProjectImage: ошибка при разборе JSON строки: ${e}`);
      }
    }
    // Если photos - строка
    else if (typeof photos === 'string' && photos.trim()) {
      imageUrl = photos;
      console.log(`SimplifiedProjectImage: используем строку как URL: ${imageUrl}`);
    }
  } catch (e) {
    console.error(`SimplifiedProjectImage: ошибка при обработке photos: ${e}`);
  }

  return (
    <div className={cn("relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-800", className)} {...props}>
      <DirectImage
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        fallbackSrc="/uploads/default-project.jpg"
      />
    </div>
  );
}