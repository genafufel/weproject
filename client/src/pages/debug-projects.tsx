import React from 'react';
import { useDebugProjects } from '@/hooks/use-debug-project';
import { ProjectImage } from '@/components/ui/universal-image';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircleAlertIcon, Clock9Icon } from 'lucide-react';

export default function DebugProjectsPage() {
  const { debugProjects, isLoading, error } = useDebugProjects();
  const [logs, setLogs] = React.useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Отладка проектов с различными форматами изображений</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Эта страница отображает тестовые проекты с различными форматами данных для изображений.
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
        
        {isLoading && (
          <div className="flex items-center justify-center p-10">
            <Clock9Icon className="animate-spin mr-2" />
            <span>Загрузка тестовых проектов...</span>
          </div>
        )}
        
        {error && (
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-700 dark:text-red-400">
                <CircleAlertIcon className="h-5 w-5 mr-2" />
                <span>Ошибка: {error.message}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {debugProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription>{project.field} • Тест: {project.testCase}</CardDescription>
                  </div>
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                    ID: {project.id}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{project.description}</p>
                
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md mb-4">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(project.images, null, 2)}
                  </pre>
                </div>
                
                <div className="aspect-video bg-gray-50 dark:bg-gray-700 rounded-md overflow-hidden">
                  <ProjectImage 
                    src={project.images}
                    alt={`Изображение для проекта: ${project.title}`}
                    className="w-full h-full object-contain"
                    onError={() => addLog(`Ошибка загрузки для проекта ID ${project.id}: ${project.testCase}`)}
                    onLoad={() => addLog(`Успешная загрузка для проекта ID ${project.id}: ${project.testCase}`)}
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