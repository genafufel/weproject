import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiErrorDebugPanel } from "@/components/api-error-debug";
import { ImageDebugPanel } from "@/components/image-debug-panel";
import { EnhancedImage } from "@/components/ui/enhanced-image";
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar";
import { imageService } from "@/lib/image-service";

interface ApiItem {
  id: number;
  title?: string;
  username?: string;
  email?: string;
  avatar?: string;
  photos?: string[];
  photo?: string;
}

export default function ImageTestPage() {
  const [showApiDebug, setShowApiDebug] = useState(false);
  const [showImageDebug, setShowImageDebug] = useState(false);
  const [users, setUsers] = useState<ApiItem[]>([]);
  const [projects, setProjects] = useState<ApiItem[]>([]);
  const [resumes, setResumes] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState({
    users: false,
    projects: false,
    resumes: false
  });

  // Загрузка данных
  const loadData = async (endpoint: string, setter: (data: ApiItem[]) => void, loadingKey: keyof typeof loading) => {
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    try {
      const response = await fetch(`/api/${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        setter(data);
      }
    } catch (error) {
      console.error(`Error loading ${endpoint}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  useEffect(() => {
    loadData('public/users', setUsers, 'users');
    loadData('projects', setProjects, 'projects');
    loadData('resumes', setResumes, 'resumes');
  }, []);

  // Принудительная предзагрузка
  const forcePreload = () => {
    imageService.preloadFromApi();
  };

  return (
    <div className="container py-8">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Тестирование изображений</h1>
          <p className="text-muted-foreground">
            Страница для проверки загрузки и отображения изображений
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={forcePreload}>
            Предзагрузить изображения
          </Button>
          <Button variant="outline" onClick={() => setShowApiDebug(!showApiDebug)}>
            {showApiDebug ? "Скрыть отладку API" : "Показать отладку API"}
          </Button>
          <Button variant="outline" onClick={() => setShowImageDebug(!showImageDebug)}>
            {showImageDebug ? "Скрыть отладку изображений" : "Показать отладку изображений"}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="projects">Проекты</TabsTrigger>
          <TabsTrigger value="resumes">Резюме</TabsTrigger>
          <TabsTrigger value="bankster">Банкстер</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <EnhancedAvatar 
                      src={user.avatar} 
                      alt={user.username || "User"} 
                      className="h-16 w-16"
                    />
                    <div>
                      <CardTitle className="text-lg">{user.username}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">ID: {user.id}</p>
                  {user.avatar && (
                    <p className="text-xs font-mono break-all mt-2">
                      Avatar URL: {user.avatar}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="ghost">Просмотреть профиль</Button>
                </CardFooter>
              </Card>
            ))}
            
            {loading.users && <p>Загрузка пользователей...</p>}
            {!loading.users && users.length === 0 && <p>Пользователи не найдены</p>}
          </div>
        </TabsContent>
        
        <TabsContent value="projects">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-md mb-4">
                    {project.photos && project.photos.length > 0 ? (
                      <EnhancedImage 
                        src={project.photos[0]} 
                        alt={project.title || "Project"} 
                        className="w-full h-36 object-cover"
                      />
                    ) : project.photo ? (
                      <EnhancedImage 
                        src={project.photo} 
                        alt={project.title || "Project"} 
                        className="w-full h-36 object-cover"
                      />
                    ) : (
                      <div className="w-full h-36 bg-muted flex items-center justify-center">
                        <span>Нет изображения</span>
                      </div>
                    )}
                  </div>
                  
                  {project.photos && project.photos.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-1">Все изображения:</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {project.photos.map((photo, idx) => (
                          <EnhancedImage 
                            key={idx}
                            src={photo} 
                            alt={`${project.title || "Project"} photo ${idx+1}`} 
                            className="w-full h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {project.photos && (
                    <p className="text-xs font-mono break-all mt-2">
                      {Array.isArray(project.photos) ? project.photos.length : 0} изображений
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="ghost">Подробнее</Button>
                </CardFooter>
              </Card>
            ))}
            
            {loading.projects && <p>Загрузка проектов...</p>}
            {!loading.projects && projects.length === 0 && <p>Проекты не найдены</p>}
          </div>
        </TabsContent>
        
        <TabsContent value="resumes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map(resume => (
              <Card key={resume.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{resume.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {resume.photos && resume.photos.length > 0 && (
                    <div className="overflow-hidden rounded-md mb-4">
                      <EnhancedImage 
                        src={resume.photos[0]} 
                        alt={resume.title || "Resume"} 
                        className="w-full h-36 object-cover"
                      />
                    </div>
                  )}
                  
                  {resume.photos && resume.photos.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium mb-1">Все изображения:</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {resume.photos.map((photo, idx) => (
                          <EnhancedImage 
                            key={idx}
                            src={photo} 
                            alt={`${resume.title || "Resume"} photo ${idx+1}`} 
                            className="w-full h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {resume.photos && (
                    <p className="text-xs font-mono break-all mt-2">
                      {Array.isArray(resume.photos) ? resume.photos.length : 0} изображений
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="ghost">Подробнее</Button>
                </CardFooter>
              </Card>
            ))}
            
            {loading.resumes && <p>Загрузка резюме...</p>}
            {!loading.resumes && resumes.length === 0 && <p>Резюме не найдены</p>}
          </div>
        </TabsContent>
        
        <TabsContent value="bankster">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <EnhancedAvatar 
                    src="/uploads/1743734897606-170046638.jpeg" 
                    alt="Bankster"
                    className="h-16 w-16"
                  />
                  <div>
                    <CardTitle className="text-lg">Bankster</CardTitle>
                    <CardDescription>ID: 6</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Аватар пользователя</h3>
                  <EnhancedImage 
                    src="/uploads/1743734897606-170046638.jpeg" 
                    alt="Bankster Avatar" 
                    className="max-w-sm rounded-md overflow-hidden"
                  />
                  <p className="text-xs font-mono break-all mt-2">
                    URL: /uploads/1743734897606-170046638.jpeg
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Проект "Бомбардиро Выскребдино"</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm mb-2">Изображение 1:</p>
                      <EnhancedImage 
                        src="/uploads/1743734805298-100203336.png" 
                        alt="Бомбардиро Выскребдино Image 1" 
                        className="w-full rounded-md overflow-hidden"
                      />
                      <p className="text-xs font-mono break-all mt-2">
                        URL: /uploads/1743734805298-100203336.png
                      </p>
                    </div>
                    <div>
                      <p className="text-sm mb-2">Изображение 2:</p>
                      <EnhancedImage 
                        src="/uploads/1743734809447-576158971.jpg" 
                        alt="Бомбардиро Выскребдино Image 2" 
                        className="w-full rounded-md overflow-hidden"
                      />
                      <p className="text-xs font-mono break-all mt-2">
                        URL: /uploads/1743734809447-576158971.jpg
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Резюме "Рантье"</h3>
                  <EnhancedImage 
                    src="/uploads/1743734874030-175873835.jpeg" 
                    alt="Рантье Resume" 
                    className="max-w-sm rounded-md overflow-hidden"
                  />
                  <p className="text-xs font-mono break-all mt-2">
                    URL: /uploads/1743734874030-175873835.jpeg
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {showApiDebug && <ApiErrorDebugPanel onClose={() => setShowApiDebug(false)} />}
      {showImageDebug && <ImageDebugPanel onClose={() => setShowImageDebug(false)} />}
    </div>
  );
}