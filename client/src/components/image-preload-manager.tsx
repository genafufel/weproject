import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

/**
 * Компонент для предзагрузки всех изображений сайта
 * Загружает изображения проектов, резюме и аватары пользователей
 * в момент запуска сайта
 */
export function ImagePreloadManager() {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Загружаем все изображения при первом монтировании компонента
    if (!loaded) {
      preloadAllImages();
    }
  }, [loaded]);
  
  const preloadAllImages = async () => {
    try {
      console.log('📸 Начинаем предзагрузку изображений...');
      
      // Параллельно запрашиваем данные из всех источников
      const [usersResponse, projectsResponse, resumesResponse] = await Promise.all([
        fetch('/api/users').then(res => res.ok ? res.json() : []),
        fetch('/api/projects').then(res => res.ok ? res.json() : []),
        fetch('/api/resumes').then(res => res.ok ? res.json() : [])
      ]);
      
      // Создаем массив URL всех изображений
      const imageUrls: string[] = [];
      
      // Добавляем дефолтное изображение
      imageUrls.push('/uploads/default.jpg');
      
      // Добавляем аватары пользователей
      usersResponse.forEach((user: any) => {
        if (user.avatar) {
          const avatar = normalizeUrl(user.avatar);
          if (!imageUrls.includes(avatar)) {
            imageUrls.push(avatar);
          }
        }
      });
      
      // Добавляем изображения проектов
      projectsResponse.forEach((project: any) => {
        if (project.photo) {
          const photo = normalizeUrl(project.photo);
          if (!imageUrls.includes(photo)) {
            imageUrls.push(photo);
          }
        }
      });
      
      // Добавляем изображения резюме
      resumesResponse.forEach((resume: any) => {
        if (resume.photo) {
          const photo = normalizeUrl(resume.photo);
          if (!imageUrls.includes(photo)) {
            imageUrls.push(photo);
          }
        }
      });
      
      // Загружаем все изображения одновременно
      await preloadImages(imageUrls);
      
      setLoaded(true);
      console.log(`✅ Предзагружено ${imageUrls.length} изображений`);
    } catch (error) {
      console.error('Ошибка предзагрузки изображений:', error);
      setLoaded(true); // Отмечаем как загруженные даже при ошибке, чтобы избежать бесконечных попыток
    }
  };
  
  return null;
}

// Нормализует URL изображения
function normalizeUrl(url: string): string {
  if (!url) return url;
  
  if (!url.startsWith('/') && !url.startsWith('http')) {
    return `/uploads/${url.split('/').pop()}`;
  }
  
  return url;
}

// Предзагружает массив изображений
function preloadImages(urls: string[]): Promise<void> {
  return new Promise((resolve) => {
    // Если нет URL для загрузки
    if (!urls.length) {
      resolve();
      return;
    }
    
    let loaded = 0;
    const total = urls.length;
    
    // Обработчик загрузки изображения
    const onLoad = () => {
      loaded++;
      if (loaded === total) {
        resolve();
      }
    };
    
    // Загружаем все изображения параллельно
    urls.forEach(url => {
      const img = new Image();
      img.onload = onLoad;
      img.onerror = onLoad; // Считаем ошибки тоже как "загруженные"
      img.src = url;
    });
    
    // Страховка: резолвим промис через 5 секунд в любом случае
    setTimeout(resolve, 5000);
  });
}