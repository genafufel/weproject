import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ProjectCardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  photos: any; // Принимаем любой формат данных для фотографий
  alt?: string;
  className?: string;
}

/**
 * Специальный компонент для отображения изображений в карточках проектов
 * Работает с любым форматом данных для фотографий (строка, массив, JSON)
 */
export function ProjectCardImage({ 
  photos, 
  alt = "Project image", 
  className, 
  ...props 
}: ProjectCardImageProps) {
  const [displaySrc, setDisplaySrc] = useState<string>('/uploads/default-project.jpg');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      if (!photos) {
        setDisplaySrc('/uploads/default-project.jpg');
        return;
      }

      // Обработка массива фотографий
      if (Array.isArray(photos) && photos.length > 0) {
        const firstPhoto = photos[0];
        if (firstPhoto && typeof firstPhoto === 'string' && firstPhoto.trim() !== '') {
          console.log("⚙️ ProjectCardImage: Используем первое фото из массива:", firstPhoto);
          setDisplaySrc(firstPhoto);
          return;
        }
      }
      
      // Обработка строки (может быть JSON или обычная строка с путем)
      if (typeof photos === 'string') {
        // Проверяем, является ли строка JSON
        try {
          if (photos.trim().startsWith('[') && photos.trim().endsWith(']')) {
            const parsedPhotos = JSON.parse(photos);
            if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
              const firstPhoto = parsedPhotos[0];
              if (firstPhoto && typeof firstPhoto === 'string' && firstPhoto.trim() !== '') {
                console.log("⚙️ ProjectCardImage: Используем первое фото из JSON-массива:", firstPhoto);
                setDisplaySrc(firstPhoto);
                return;
              }
            }
          } else if (photos.trim().startsWith('{') && photos.trim().endsWith('}')) {
            const parsedObject = JSON.parse(photos);
            if (parsedObject.url) {
              console.log("⚙️ ProjectCardImage: Используем URL из JSON-объекта:", parsedObject.url);
              setDisplaySrc(parsedObject.url);
              return;
            } else if (parsedObject.photos && Array.isArray(parsedObject.photos) && parsedObject.photos.length > 0) {
              console.log("⚙️ ProjectCardImage: Используем первое фото из свойства photos в JSON-объекте:", parsedObject.photos[0]);
              setDisplaySrc(parsedObject.photos[0]);
              return;
            }
          }
        } catch (err) {
          // Если не удалось разобрать JSON, считаем что это обычная строка с путем
        }

        // Если это просто строка с путем к фото
        if (photos.trim() !== '') {
          console.log("⚙️ ProjectCardImage: Используем строку как путь к фото:", photos);
          setDisplaySrc(photos);
          return;
        }
      }

      // Если ничего не подошло, используем дефолтное изображение
      setDisplaySrc('/uploads/default-project.jpg');
    } catch (error) {
      console.error("❌ ProjectCardImage: Ошибка при обработке фото:", error);
      setDisplaySrc('/uploads/default-project.jpg');
    }
  }, [photos]);

  function handleLoad() {
    setIsLoading(false);
    setHasError(false);
  }

  function handleError() {
    setIsLoading(false);
    setHasError(true);
    console.error(`❌ ProjectCardImage: Ошибка загрузки изображения: ${displaySrc}`);
    setDisplaySrc('/uploads/default-project.jpg');
  }

  return (
    <div className={cn("relative h-48 w-full", className)} {...props}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <img
        src={displaySrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
          isLoading && "opacity-0",
          hasError && "opacity-50"
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}