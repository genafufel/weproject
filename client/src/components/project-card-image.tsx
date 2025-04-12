import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProjectCardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  photos: any; // Принимаем любой формат данных для фотографий
  alt?: string;
  className?: string;
}

/**
 * Максимально упрощенный компонент для отображения изображений проектов
 * Работает напрямую в DOM без лишних абстракций
 */
export function ProjectCardImage({ 
  photos, 
  alt = "Project image", 
  className,
  ...props 
}: ProjectCardImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Получаем абсолютный URL к изображению
  const getImageSrc = (photos: any): string => {
    try {
      // Пустые данные
      if (!photos) return window.location.origin + '/uploads/default-project.jpg';
      
      // Массив изображений
      if (Array.isArray(photos) && photos.length > 0) {
        let firstPhoto = photos[0];
        console.log("🎯 Прямой URL: Использую изображение из массива:", firstPhoto);
        if (!firstPhoto) return window.location.origin + '/uploads/default-project.jpg';
        
        // Добавляем протокол и хост к относительному URL
        if (firstPhoto.startsWith('/')) {
          return window.location.origin + firstPhoto;
        }
        return firstPhoto;
      }

      // JSON строка с массивом
      if (typeof photos === 'string') {
        // Попытка парсинга JSON
        if (photos.startsWith('[') && photos.endsWith(']')) {
          try {
            const parsedPhotos = JSON.parse(photos);
            if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
              const firstPhoto = parsedPhotos[0];
              console.log("🎯 Прямой URL: Использую изображение из JSON массива:", firstPhoto);
              
              // Добавляем протокол и хост к относительному URL
              if (firstPhoto.startsWith('/')) {
                return window.location.origin + firstPhoto;
              }
              return firstPhoto;
            }
          } catch (e) {
            // Если не удалось распарсить, продолжаем
          }
        }
        
        // Одиночная строка (путь к изображению)
        if (photos.trim() !== '') {
          console.log("🎯 Прямой URL: Использую строку как путь:", photos);
          
          // Добавляем протокол и хост к относительному URL
          if (photos.startsWith('/')) {
            return window.location.origin + photos;
          }
          return photos;
        }
      }

      // По умолчанию возвращаем дефолтное изображение с абсолютным URL
      return window.location.origin + '/uploads/default-project.jpg';
    } catch (e) {
      console.error("Ошибка получения изображения:", e);
      return window.location.origin + '/uploads/default-project.jpg';
    }
  };

  const handleError = () => {
    console.log("❌ Ошибка загрузки изображения");
    setHasError(true);
  };

  const handleLoad = () => {
    console.log("✅ Изображение успешно загружено");
    setIsLoaded(true);
    setHasError(false);
  };

  return (
    <div className={cn("relative h-48 w-full", className)} {...props}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <img
        src={getImageSrc(photos)}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
          hasError && "opacity-0"
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}