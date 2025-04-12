import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProjectCardImage } from "@/components/project-card-image";
import { apiRequest } from "@/lib/queryClient";

export default function DebugBombardiro() {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchProject() {
      try {
        // Загружаем проект "Бомбардиро Выскребдино" (ID 3 по логам)
        const res = await apiRequest("GET", "/api/projects/3");
        const data = await res.json();
        setProject(data);
        console.log("Получены данные проекта:", data);
        
        if (data.photos) {
          console.log("Тип photos:", typeof data.photos);
          console.log("Значение photos:", data.photos);
          
          if (Array.isArray(data.photos)) {
            console.log("Photos - это массив длиной", data.photos.length);
            data.photos.forEach((photo: any, index: number) => {
              console.log(`Фото ${index}:`, photo);
            });
          } else if (typeof data.photos === 'string') {
            try {
              const parsed = JSON.parse(data.photos);
              console.log("Photos преобразованы из JSON:", parsed);
            } catch (e) {
              console.log("Photos нельзя преобразовать из JSON:", e);
            }
          }
        }
      } catch (err) {
        console.error("Ошибка при загрузке проекта:", err);
        setError("Ошибка при загрузке данных проекта");
      } finally {
        setLoading(false);
      }
    }
    
    fetchProject();
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8 text-primary">Отладка проекта "Бомбардиро Выскребдино"</h1>
          
          {loading ? (
            <div className="text-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Загрузка данных проекта...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
              <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Ошибка</h2>
              <p>{error}</p>
            </div>
          ) : project ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Данные проекта</h2>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-xs">{JSON.stringify(project, null, 2)}</pre>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Тестирование отображения</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">1. ProjectCardImage с photos из проекта</h3>
                      <ProjectCardImage photos={project.photos} alt={project.title} className="h-48 rounded-lg" />
                      <p className="mt-2 text-sm text-gray-500">
                        <code>photos</code> передан как {typeof project.photos}
                        {Array.isArray(project.photos) ? `, длина: ${project.photos.length}` : ''}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">2. Прямой img для первой фотографии</h3>
                      {Array.isArray(project.photos) && project.photos.length > 0 ? (
                        <div className="h-48 rounded-lg overflow-hidden">
                          <img 
                            src={project.photos[0]} 
                            alt={project.title} 
                            className="w-full h-full object-cover"
                            onLoad={() => console.log("Прямой img загружен успешно")}
                            onError={(e) => {
                              console.error("Ошибка загрузки прямого img:", e);
                              e.currentTarget.src = "/uploads/default-project.jpg";
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-red-500">Нет фотографий в массиве</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">3. Стандартный img с абсолютным URL первого фото</h3>
                      {Array.isArray(project.photos) && project.photos.length > 0 ? (
                        <div className="h-48 rounded-lg overflow-hidden">
                          <img 
                            src={`${window.location.origin}${project.photos[0]}`} 
                            alt={project.title} 
                            className="w-full h-full object-cover"
                            onLoad={() => console.log("Абсолютный URL img загружен успешно")}
                            onError={(e) => {
                              console.error("Ошибка загрузки абсолютного URL img:", e);
                              e.currentTarget.src = "/uploads/default-project.jpg";
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-red-500">Нет фотографий в массиве</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">4. Image с жестко заданным URL изображения</h3>
                      <div className="h-48 rounded-lg overflow-hidden">
                        <img 
                          src="/uploads/1744408001371-521291339.png" 
                          alt="Прямой URL" 
                          className="w-full h-full object-cover"
                          onLoad={() => console.log("Жестко заданный URL загружен успешно")}
                          onError={(e) => {
                            console.error("Ошибка загрузки жестко заданного URL:", e);
                            e.currentTarget.src = "/uploads/default-project.jpg";
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">5. Изображение с экстра-надежным фолбеком</h3>
                      <div className="h-48 rounded-lg overflow-hidden relative">
                        {Array.isArray(project.photos) && project.photos.length > 0 ? (
                          <img 
                            key="primary"
                            src={project.photos[0]} 
                            alt={project.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error("Переходим на запасной вариант 1");
                              const img = e.currentTarget;
                              img.style.display = 'none';
                              document.getElementById('fallback-1')!.style.display = 'block';
                            }}
                          />
                        ) : (
                          <img src="/uploads/default-project.jpg" alt="Default" className="w-full h-full object-cover" />
                        )}
                        
                        <img 
                          id="fallback-1"
                          src={`${window.location.origin}${Array.isArray(project.photos) && project.photos.length > 0 ? project.photos[0] : ''}`}
                          alt={project.title} 
                          className="w-full h-full object-cover absolute inset-0"
                          style={{ display: 'none' }}
                          onError={(e) => {
                            console.error("Переходим на запасной вариант 2");
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            document.getElementById('fallback-2')!.style.display = 'block';
                          }}
                        />
                        
                        <img 
                          id="fallback-2"
                          src="/uploads/1744408001371-521291339.png"
                          alt="Direct path" 
                          className="w-full h-full object-cover absolute inset-0"
                          style={{ display: 'none' }}
                          onError={(e) => {
                            console.error("Переходим на запасной вариант 3 (default)");
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            document.getElementById('fallback-default')!.style.display = 'block';
                          }}
                        />
                        
                        <img 
                          id="fallback-default"
                          src="/uploads/default-project.jpg"
                          alt="Default" 
                          className="w-full h-full object-cover absolute inset-0"
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>Проект не найден</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}