import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ProjectCardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  photos: any; // Принимаем любой формат данных для фотографий
  alt?: string;
  className?: string;
}

/**
 * Полностью переработанная версия компонента для отображения изображений проектов
 * с прямой поддержкой различных форматов данных и безопасным фолбеком
 */
export function ProjectCardImage({ 
  photos, 
  alt = "Project image", 
  className, 
  ...props 
}: ProjectCardImageProps) {
  const [useDefault, setUseDefault] = useState(false);
  
  // Получение URL изображения
  const DEFAULT_IMAGE = '/uploads/default-project.jpg';
  
  let imageUrl = '';
  
  // Если уже установлен флаг использования стандартного изображения
  if (useDefault) {
    imageUrl = DEFAULT_IMAGE;
  } else {
    // Получаем URL из photos
    try {
      // 1. Проверка на null/undefined
      if (!photos) {
        console.log('ProjectCardImage: photos is null/undefined');
        imageUrl = DEFAULT_IMAGE;
      } 
      // 2. Проверка массива
      else if (Array.isArray(photos) && photos.length > 0) {
        const firstPhoto = photos[0];
        if (typeof firstPhoto === 'string' && firstPhoto.trim()) {
          console.log(`ProjectCardImage: Используем первое фото из массива: ${firstPhoto}`);
          imageUrl = firstPhoto;
        } else {
          imageUrl = DEFAULT_IMAGE;
        }
      } 
      // 3. Проверка строки с JSON
      else if (typeof photos === 'string' && photos.trim().startsWith('[') && photos.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(photos);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const firstPhoto = parsed[0];
            if (typeof firstPhoto === 'string' && firstPhoto.trim()) {
              console.log(`ProjectCardImage: Используем первое фото из JSON-строки: ${firstPhoto}`);
              imageUrl = firstPhoto;
            } else {
              imageUrl = DEFAULT_IMAGE;
            }
          } else {
            imageUrl = DEFAULT_IMAGE;
          }
        } catch (e) {
          console.warn('ProjectCardImage: Ошибка при разборе JSON строки', e);
          imageUrl = DEFAULT_IMAGE;
        }
      } 
      // 4. Проверка одиночной строки
      else if (typeof photos === 'string' && photos.trim()) {
        console.log(`ProjectCardImage: Используем строку как URL: ${photos}`);
        imageUrl = photos;
      } 
      // 5. Проверка объекта с полем url или src
      else if (typeof photos === 'object' && photos !== null) {
        if (typeof photos.url === 'string' && photos.url.trim()) {
          console.log(`ProjectCardImage: Используем URL из объекта: ${photos.url}`);
          imageUrl = photos.url;
        } else if (typeof photos.src === 'string' && photos.src.trim()) {
          console.log(`ProjectCardImage: Используем SRC из объекта: ${photos.src}`);
          imageUrl = photos.src;
        } else {
          imageUrl = DEFAULT_IMAGE;
        }
      } 
      // 6. Другие случаи
      else {
        console.log('ProjectCardImage: Неизвестный формат photos');
        imageUrl = DEFAULT_IMAGE;
      }
    } catch (e) {
      console.error('ProjectCardImage: Ошибка при получении URL изображения', e);
      imageUrl = DEFAULT_IMAGE;
    }
  }
  
  // Нормализация URL
  if (imageUrl !== DEFAULT_IMAGE) {
    // Удаляем экранирование кавычек
    imageUrl = imageUrl.replace(/^"+|"+$/g, '');
    imageUrl = imageUrl.replace(/\\"/g, '');
    
    // Формируем полный URL, если это относительный путь
    if (imageUrl.startsWith('/')) {
      // Относительный путь с ведущим слешем - уже хорошо
      // Не нужно добавлять window.location.origin, это делает браузер
    } else if (!imageUrl.startsWith('http')) {
      // Для файлов без слеша в начале добавляем путь к папке uploads
      imageUrl = '/uploads/' + imageUrl;
    }
  }
  
  // Отладочная информация
  console.log(`ProjectCardImage: Финальный URL: ${imageUrl}`);
  
  // Рендеринг
  return (
    <div className={cn("relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-800", className)} {...props}>
      {/* Изображение с обработкой ошибок */}
      <img 
        src={imageUrl} 
        alt={alt} 
        className="w-full h-full object-cover"
        onError={(e) => {
          const currentSrc = e.currentTarget.src;
          console.warn(`ProjectCardImage: Ошибка загрузки изображения: ${currentSrc}`);
          
          // Проверяем, не пытаемся ли мы уже загрузить дефолтное изображение
          if (!currentSrc.endsWith(DEFAULT_IMAGE) && !useDefault) {
            console.log('ProjectCardImage: Переключаемся на дефолтное изображение');
            setUseDefault(true);
            e.currentTarget.src = DEFAULT_IMAGE;
          }
        }}
      />
    </div>
  );
}