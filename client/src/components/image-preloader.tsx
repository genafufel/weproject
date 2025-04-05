import { useEffect, useState } from 'react';

interface ImagePreloaderProps {
  imageUrls: string[];
  onComplete?: () => void;
}

/**
 * Компонент для предзагрузки изображений при загрузке приложения
 */
export function PreloadImages({ imageUrls, onComplete }: ImagePreloaderProps) {
  const [loadedCount, setLoadedCount] = useState(0);
  
  useEffect(() => {
    // Если нет изображений для предзагрузки, сразу завершаем
    if (!imageUrls.length) {
      if (onComplete) onComplete();
      return;
    }
    
    // Загружаем все изображения параллельно
    let loadedImages = 0;
    const totalImages = imageUrls.length;
    
    // Обработчик загрузки изображения
    const onImageLoad = () => {
      loadedImages++;
      setLoadedCount(loadedImages);
      
      // Когда все изображения загружены, вызываем callback
      if (loadedImages === totalImages && onComplete) {
        onComplete();
      }
    };
    
    // Предзагружаем все изображения
    imageUrls.forEach(url => {
      if (!url) {
        onImageLoad(); // Считаем пустой URL как уже загруженный
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        onImageLoad();
      };
      
      img.onerror = () => {
        onImageLoad(); // Если изображение не загрузилось, все равно считаем его обработанным
      };
      
      // Нормализуем URL для загрузки
      if (!url.startsWith('/') && !url.startsWith('http')) {
        img.src = `/uploads/${url.split('/').pop()}`;
      } else {
        img.src = url;
      }
    });
    
    // Если по какой-то причине колбэк не был вызван, вызываем его через таймаут
    const fallbackTimer = setTimeout(() => {
      if (loadedImages < totalImages && onComplete) {
        onComplete();
      }
    }, 5000); // 5 секунд максимального ожидания
    
    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [imageUrls, onComplete]);
  
  // Компонент не рендерит ничего видимого
  return null;
}

/**
 * Хук для предзагрузки начальных изображений сайта
 */
export function useInitialImagePreloader() {
  const [isPreloading, setIsPreloading] = useState(true);
  const [initialImagesPreloaded, setInitialImagesPreloaded] = useState(false);
  
  // Список основных изображений для предзагрузки
  const staticImages = [
    '/uploads/default.jpg',
    // Добавьте сюда другие важные изображения
  ];
  
  useEffect(() => {
    // Загрузка основных изображений
    const loadInitialImages = async () => {
      try {
        // Получаем основные данные из API
        const [usersResponse, projectsResponse, resumesResponse] = await Promise.all([
          fetch('/api/users').then(res => res.ok ? res.json() : []),
          fetch('/api/projects').then(res => res.ok ? res.json() : []),
          fetch('/api/resumes').then(res => res.ok ? res.json() : [])
        ]);
        
        // Собираем все URL изображений
        const imageUrls = [...staticImages];
        
        // Добавляем аватары пользователей
        usersResponse.forEach((user: any) => {
          if (user.avatar) {
            imageUrls.push(user.avatar);
          }
        });
        
        // Добавляем фото проектов
        projectsResponse.forEach((project: any) => {
          if (project.photo) {
            imageUrls.push(project.photo);
          }
        });
        
        // Добавляем фото резюме
        resumesResponse.forEach((resume: any) => {
          if (resume.photo) {
            imageUrls.push(resume.photo);
          }
        });
        
        // Предзагружаем все собранные изображения
        const imgs = imageUrls.map(url => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            
            // Нормализуем URL для загрузки
            if (!url.startsWith('/') && !url.startsWith('http')) {
              img.src = `/uploads/${url.split('/').pop()}`;
            } else {
              img.src = url;
            }
          });
        });
        
        // Ждем загрузки всех изображений (с таймаутом)
        const timeout = new Promise<void>(resolve => setTimeout(resolve, 3000));
        await Promise.race([Promise.all(imgs), timeout]);
        
        setInitialImagesPreloaded(true);
      } catch (error) {
        console.error('Error preloading images:', error);
      } finally {
        setIsPreloading(false);
      }
    };
    
    loadInitialImages();
  }, []);
  
  return { isPreloading, initialImagesPreloaded };
}