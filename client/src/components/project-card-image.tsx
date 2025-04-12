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
  // Улучшенная обработка данных с отладочной информацией
  function getImageUrl(): string {
    try {
      // Стандартное изображение (всегда доступно)
      const DEFAULT_IMAGE = window.location.origin + '/uploads/default-project.jpg';
      
      console.log(`ProjectCardImage: Получен photos типа ${typeof photos}`, photos);
      
      // Если совсем ничего нет
      if (!photos) {
        console.log('ProjectCardImage: photos пустой, возвращаем DEFAULT_IMAGE');
        return DEFAULT_IMAGE;
      }
      
      // Если массив строк
      if (Array.isArray(photos) && photos.length > 0) {
        const url = photos[0];
        console.log(`ProjectCardImage: Получен массив, первый элемент: ${url}`);
        
        if (!url) return DEFAULT_IMAGE;
        
        if (url.startsWith('/')) {
          const fullUrl = window.location.origin + url;
          console.log(`ProjectCardImage: Формируем полный URL: ${fullUrl}`);
          return fullUrl;
        }
        
        return url;
      }
      
      // Если строка
      if (typeof photos === 'string') {
        console.log(`ProjectCardImage: Получена строка: ${photos}`);
        
        // Это массив в формате JSON?
        if (photos.startsWith('[') && photos.endsWith(']')) {
          try {
            console.log('ProjectCardImage: Пробуем разобрать JSON');
            const parsed = JSON.parse(photos);
            
            if (Array.isArray(parsed) && parsed.length > 0) {
              const url = parsed[0];
              console.log(`ProjectCardImage: JSON успешно разобран, первый элемент: ${url}`);
              
              if (url && typeof url === 'string' && url.startsWith('/')) {
                const fullUrl = window.location.origin + url;
                console.log(`ProjectCardImage: Формируем полный URL из JSON: ${fullUrl}`);
                return fullUrl;
              }
              
              return url || DEFAULT_IMAGE;
            }
          } catch (e) {
            console.log('ProjectCardImage: Ошибка разбора JSON, обрабатываем как обычную строку');
          }
        }
        
        // Строка может быть URL-путем
        if (photos.startsWith('/')) {
          const fullUrl = window.location.origin + photos;
          console.log(`ProjectCardImage: Формируем полный URL из строки: ${fullUrl}`);
          return fullUrl;
        }
        
        // Возможно строка уже содержит полный URL
        if (photos.startsWith('http')) {
          console.log(`ProjectCardImage: Получен абсолютный URL: ${photos}`);
          return photos;
        }
        
        // Другие случаи: если это имя файла, добавляем uploads
        if (!photos.includes('/')) {
          const fullUrl = window.location.origin + '/uploads/' + photos;
          console.log(`ProjectCardImage: Преобразуем имя файла в путь: ${fullUrl}`);
          return fullUrl;
        }
        
        return photos;
      }
      
      // В крайнем случае
      console.log('ProjectCardImage: Не удалось определить формат, возвращаем DEFAULT_IMAGE');
      return DEFAULT_IMAGE;
    } catch (e) {
      // Отображаем ошибку и используем запасной вариант
      console.error('ProjectCardImage: Ошибка при попытке получить URL изображения:', e);
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
          const originalSrc = e.currentTarget.src;
          console.error(`Ошибка загрузки изображения: ${originalSrc}`);
          
          // Проверяем, что это не дефолтное изображение, чтобы избежать бесконечного цикла
          const defaultImg = window.location.origin + '/uploads/default-project.jpg';
          if (originalSrc !== defaultImg) {
            e.currentTarget.src = defaultImg;
          }
        }}
      />
    </div>
  );
}