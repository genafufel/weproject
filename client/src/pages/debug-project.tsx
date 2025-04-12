import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ProjectImage } from "@/components/ui/universal-image";
import { Project } from "@shared/schema";

export default function DebugProject() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id);

  // Получаем данные проекта
  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId && !isNaN(projectId),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Отладка проекта #{id}</h1>
        
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-300">
            Ошибка при загрузке проекта
          </div>
        )}
        
        {project && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Фотографии (неформатированный вывод):</h3>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-xs max-h-60">
                      {JSON.stringify(project.photos, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Детальная информация по каждому фото:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.isArray(project.photos) ? (
                        project.photos.map((photo: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div>
                                  <span className="font-bold">Индекс:</span> {index}
                                </div>
                                <div>
                                  <span className="font-bold">Тип:</span> {typeof photo}
                                </div>
                                <div>
                                  <span className="font-bold">Значение:</span> 
                                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 text-xs overflow-auto">
                                    {JSON.stringify(photo)}
                                  </pre>
                                </div>
                                <div>
                                  <span className="font-bold">Предпросмотр:</span>
                                  <div className="mt-2 border rounded-md overflow-hidden">
                                    <ProjectImage 
                                      src={photo} 
                                      alt={`Photo ${index}`} 
                                      className="w-full h-44 object-cover"
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-2 bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-700 dark:text-yellow-300">
                          Фотографии не являются массивом. Тип: {typeof project.photos}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}