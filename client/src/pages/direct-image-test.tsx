import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Страница для прямого тестирования изображений без промежуточных компонентов
 */
export default function DirectImageTest() {
  // Массив с изображениями для тестирования
  const testImages = [
    {
      name: "Аватар Bankster",
      path: "/uploads/bankster.jpeg"
    },
    {
      name: "Concrete",
      path: "/uploads/concrete.jpeg"
    },
    {
      name: "Бетон",
      path: "/uploads/beton.jpg"
    },
    {
      name: "Предыдущее изображение",
      path: "/uploads/1743734874030-175873835.jpeg"
    }
  ];

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Прямое тестирование изображений</h1>
      <p className="mb-8 text-muted-foreground">
        Загрузка изображений напрямую через HTML-тег img без промежуточных компонентов
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testImages.map((image, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{image.name}</CardTitle>
              <p className="text-xs font-mono mt-1 text-muted-foreground break-all">
                Путь: {image.path}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* Прямое вставление изображения через HTML img без кастомных компонентов */}
                <div className="border rounded-lg overflow-hidden p-4">
                  <p className="text-sm font-semibold mb-2">Прямой тег img:</p>
                  <img 
                    src={image.path} 
                    alt={image.name} 
                    className="max-w-full h-auto max-h-64 mx-auto"
                  />
                </div>

                {/* Добавляем полный URL для сравнения */}
                <div className="border rounded-lg overflow-hidden p-4">
                  <p className="text-sm font-semibold mb-2">URL с полным путем:</p>
                  <img 
                    src={`${window.location.origin}${image.path}`} 
                    alt={image.name} 
                    className="max-w-full h-auto max-h-64 mx-auto"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}