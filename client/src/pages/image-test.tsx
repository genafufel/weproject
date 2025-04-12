import React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function ImageTest() {
  // Фиксированные пути к изображениям из логов
  const paths = [
    "/uploads/1744408001371-521291339.png",
    "/uploads/1744408008480-122786513.png",
    "/uploads/1743605280228-572081855.jpg",
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8 text-primary">Тест отображения изображений</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Тест 1: Стандартный img с абсолютным путем */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Стандартный img с абсолютным путем</h2>
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded overflow-hidden mb-2">
                <img 
                  src={`${window.location.origin}${paths[0]}`} 
                  alt="Тест изображения 1"
                  className="w-full h-full object-cover"
                  onLoad={() => console.log("Тест 1: Изображение загружено успешно")}
                  onError={(e) => {
                    console.error("Тест 1: Ошибка загрузки изображения", e);
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 break-all">URL: {`${window.location.origin}${paths[0]}`}</p>
            </div>
            
            {/* Тест 2: Стандартный img с относительным путем */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Стандартный img с относительным путем</h2>
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded overflow-hidden mb-2">
                <img 
                  src={paths[1]} 
                  alt="Тест изображения 2" 
                  className="w-full h-full object-cover"
                  onLoad={() => console.log("Тест 2: Изображение загружено успешно")}
                  onError={(e) => {
                    console.error("Тест 2: Ошибка загрузки изображения", e);
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 break-all">URL: {paths[1]}</p>
            </div>
            
            {/* Тест 3: URL с кодированием */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">URL с кодированием</h2>
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded overflow-hidden mb-2">
                <img 
                  src={encodeURI(`${window.location.origin}${paths[2]}`)} 
                  alt="Тест изображения 3"
                  className="w-full h-full object-cover"
                  onLoad={() => console.log("Тест 3: Изображение загружено успешно")}
                  onError={(e) => {
                    console.error("Тест 3: Ошибка загрузки изображения", e);
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 break-all">URL: {encodeURI(`${window.location.origin}${paths[2]}`)}</p>
            </div>

            {/* Тест 4: Прямая вставка URL в стиль */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Прямая вставка URL в стиль</h2>
              <div 
                className="aspect-video bg-gray-100 dark:bg-gray-700 rounded overflow-hidden mb-2"
                style={{ backgroundImage: `url(${window.location.origin}${paths[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              ></div>
              <p className="text-sm text-gray-500 break-all">URL: {`${window.location.origin}${paths[0]}`}</p>
            </div>

            {/* Тест 5: Дефолтное изображение */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Дефолтное изображение</h2>
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded overflow-hidden mb-2">
                <img 
                  src={`${window.location.origin}/uploads/default-project.jpg`} 
                  alt="Тест изображения 5"
                  className="w-full h-full object-cover"
                  onLoad={() => console.log("Тест 5: Изображение загружено успешно")}
                  onError={(e) => {
                    console.error("Тест 5: Ошибка загрузки изображения", e);
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 break-all">URL: {`${window.location.origin}/uploads/default-project.jpg`}</p>
            </div>

            {/* Тест 6: Изображение с fallback */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Изображение с fallback</h2>
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded overflow-hidden mb-2">
                <img 
                  src="/uploads/non-existing-image.jpg" 
                  alt="Тест изображения 6"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log("Тест 6: Сработал fallback");
                    e.currentTarget.src = `${window.location.origin}/uploads/default-project.jpg`;
                  }}
                  onLoad={() => console.log("Тест 6: Изображение загружено успешно")}
                />
              </div>
              <p className="text-sm text-gray-500 break-all">
                Исходный URL: /uploads/non-existing-image.jpg<br/>
                Fallback URL: {`${window.location.origin}/uploads/default-project.jpg`}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}