import { cn } from '@/lib/utils';

interface ProjectCardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  photos: any; // Принимаем любой формат данных для фотографий
  alt?: string;
  className?: string;
}

/**
 * Предельно упрощенный компонент для отображения карточек
 * со встроенной заглушкой по умолчанию
 */
export function ProjectCardImage({ 
  photos, 
  alt = "Project image", 
  className, 
  ...props 
}: ProjectCardImageProps) {
  // Абсолютно минимальная обработка данных для обеспечения работы компонента
  function getImageUrl(): string {
    try {
      // Стандартное изображение (всегда доступно)
      const DEFAULT_IMAGE = window.location.origin + '/uploads/default-project.jpg';
      
      // Если совсем ничего нет
      if (!photos) return DEFAULT_IMAGE;
      
      // Если массив строк
      if (Array.isArray(photos) && photos.length > 0) {
        const url = photos[0];
        if (!url) return DEFAULT_IMAGE;
        
        if (url.startsWith('/')) {
          return window.location.origin + url;
        }
        return url;
      }
      
      // Если строка
      if (typeof photos === 'string') {
        // Это массив в формате JSON?
        if (photos.startsWith('[') && photos.endsWith(']')) {
          try {
            const parsed = JSON.parse(photos);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const url = parsed[0];
              if (url.startsWith('/')) {
                return window.location.origin + url;
              }
              return url;
            }
          } catch (e) {
            // Нет, это не JSON
          }
        }
        
        // Просто URL
        if (photos.startsWith('/')) {
          return window.location.origin + photos;
        }
        return photos;
      }
      
      // В крайнем случае
      return DEFAULT_IMAGE;
    } catch (e) {
      // Отображаем ошибку и используем запасной вариант
      console.error('Ошибка при попытке получить URL изображения:', e);
      return window.location.origin + '/uploads/default-project.jpg';
    }
  }
  
  // Прямой рендер без лишних состояний и обработчиков
  return (
    <div className={cn("relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-800", className)} {...props}>
      <img 
        src={getImageUrl()} 
        alt={alt} 
        className="w-full h-full object-cover"
        onError={(e) => {
          // Если ошибка загрузки - заменяем на дефолтную
          console.error('Ошибка загрузки изображения');
          e.currentTarget.src = window.location.origin + '/uploads/default-project.jpg';
        }}
      />
    </div>
  );
}