import React from 'react';
import { ProjectImage } from '@/components/ui/universal-image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Тестовые данные для проверки различных форматов
const TEST_CASES = [
  {
    type: 'Массив строк',
    data: ['/uploads/1744408001371-521291339.png', '/uploads/1744408008480-122786513.png'],
    description: 'Массив строк с путями к нескольким фотографиям'
  },
  {
    type: 'JSON-строка с массивом',
    data: JSON.stringify(['/uploads/1744408001371-521291339.png', '/uploads/1744408008480-122786513.png']),
    description: 'JSON-строка, представляющая массив с путями'
  },
  {
    type: 'Обычная строка',
    data: '/uploads/1744408001371-521291339.png',
    description: 'Обычная строка с путем'
  },
  {
    type: 'Пустой массив',
    data: [],
    description: 'Пустой массив'
  },
  {
    type: 'undefined',
    data: undefined,
    description: 'Неопределенное значение'
  },
  {
    type: 'null',
    data: null,
    description: 'Нулевое значение'
  },
  {
    type: 'Фото из проектов',
    data: '/uploads/1743605280228-572081855.jpg',
    description: 'Фото из предыдущих проектов'
  },
  {
    type: 'Дефолтные фото',
    data: '/uploads/default-project.jpg',
    description: 'Дефолтное изображение проекта'
  }
];

export default function ImageDebugPage() {
  const [logs, setLogs] = React.useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Отладка отображения изображений</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Эта страница предназначена для тестирования различных форматов данных изображений.
          </p>
          
          <Button 
            onClick={() => setLogs([])} 
            variant="outline" 
            className="mb-4"
          >
            Очистить логи
          </Button>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Логи</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md max-h-40 overflow-y-auto font-mono text-sm">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">Логи будут отображаться здесь</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEST_CASES.map((testCase, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{testCase.type}</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">{testCase.description}</p>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md mb-4">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(testCase.data, null, 2)}
                  </pre>
                </div>
                
                <div className="h-48 bg-gray-50 dark:bg-gray-700 rounded-md overflow-hidden">
                  <ProjectImage 
                    src={testCase.data as any}
                    alt={`Тест: ${testCase.type}`}
                    className="w-full h-full object-contain"
                    onError={() => addLog(`Ошибка загрузки для теста: ${testCase.type}`)}
                    onLoad={() => addLog(`Успешная загрузка для теста: ${testCase.type}`)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}