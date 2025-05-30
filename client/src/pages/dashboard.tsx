import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { PlusIcon, Briefcase, FileText, Inbox, Loader2, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { apiRequest } from "@/lib/queryClient";

interface Project {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  userId: number;
  field: string;
  remote?: boolean;
  location?: string;
  positions?: any[];
  applications?: any[];
  [key: string]: any;
}

interface Resume {
  id: number;
  title: string;
  direction: string;
  skills: string[];
  education: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    description?: string;
    [key: string]: any;
  }[];
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
    [key: string]: any;
  }[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  userId: number;
  [key: string]: any;
}

interface Application {
  id: number;
  projectId: number;
  userId: number;
  resumeId: number;
  message: string;
  status: string;
  createdAt: string;
  project?: Project;
  user?: {
    id: number;
    username: string;
    fullName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    [key: string]: any;
  };
  resume?: Resume;
  [key: string]: any;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { unreadCount } = useNotifications();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Получаем проекты пользователя
  const {
    data: projects,
    isLoading: projectsLoading,
  } = useQuery<Project[]>({
    queryKey: [`/api/projects?userId=${user?.id}`],
    enabled: !!user?.id,
  });

  // Получаем резюме пользователя
  const {
    data: resumes,
    isLoading: resumesLoading,
  } = useQuery<Resume[]>({
    queryKey: [`/api/resumes?userId=${user?.id}`],
    enabled: !!user?.id,
  });

  // Получаем заявки пользователя (отправленные)
  const {
    data: sentApplications,
    isLoading: sentApplicationsLoading,
  } = useQuery<Application[]>({
    queryKey: ["/api/applications?mode=sent"],
    enabled: !!user?.id,
  });

  // Получаем заявки на проекты пользователя (полученные)
  const {
    data: receivedApplications,
    isLoading: receivedApplicationsLoading,
  } = useQuery<Application[]>({
    queryKey: ["/api/applications?mode=received"],
    enabled: !!user?.id && Array.isArray(projects) && projects.length > 0,
  });
  
  // Мутация для обновления статуса заявки
  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest("PATCH", `/api/applications/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications?mode=received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications?mode=sent"] });
      toast({
        title: "Статус заявки обновлен",
        description: "Статус заявки был успешно обновлен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить статус заявки: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Устанавливаем tab из URL при монтировании и слушаем события изменения таба
  useEffect(() => {
    const updateTabFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab && ['profile', 'applicant', 'project', 'investor'].includes(tab)) {
        setActiveTab(tab);
      }
    };
    
    // Определяем обработчик пользовательского события tabchange
    const handleTabChange = (event: any) => {
      // Если указан конкретный maintab, обновляем главную вкладку
      if (event.detail && event.detail.maintab) {
        setActiveTab(event.detail.maintab);
        
        // Если указан subtab, устанавливаем соответствующую подвкладку
        if (event.detail.subtab) {
          // Немного задерживаем, чтобы контент главной вкладки успел смонтироваться
          setTimeout(() => {
            const subtabTrigger = document.querySelector(`[data-subtab="${event.detail.subtab}"]`);
            if (subtabTrigger) {
              (subtabTrigger as HTMLElement).click();
            }
          }, 50);
        }
      } 
      // Для обратной совместимости
      else if (event.detail && event.detail.tab) {
        setActiveTab(event.detail.tab);
      }
    };
    
    // Вызываем при монтировании
    updateTabFromUrl();
    
    // Добавляем слушатели событий
    window.addEventListener('popstate', updateTabFromUrl);
    window.addEventListener('tabchange', handleTabChange);
    
    // Удаляем слушатели при размонтировании
    return () => {
      window.removeEventListener('popstate', updateTabFromUrl);
      window.removeEventListener('tabchange', handleTabChange);
    };
  }, []);
  
  // Дополнительный обработчик для изменения URL при выборе вкладки
  const onTabChange = (value: string) => {
    setActiveTab(value);
    // Обновляем URL без перезагрузки страницы
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url);
  };
  
  // Мутация для переключения видимости резюме
  const toggleVisibilityMutation = useMutation({
    mutationFn: async (resumeId: number) => {
      const response = await apiRequest(
        'PATCH', 
        `/api/resumes/${resumeId}/toggle-visibility`
      );
      return await response.json();
    },
    onSuccess: () => {
      // Инвалидируем кеш для обновления списка резюме
      queryClient.invalidateQueries({queryKey: [`/api/resumes?userId=${user?.id}`]});
      queryClient.invalidateQueries({queryKey: ["/api/public/resumes"]});
      
      toast({
        title: "Видимость резюме обновлена",
        description: "Изменения успешно сохранены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка обновления",
        description: "Не удалось изменить видимость резюме",
        variant: "destructive",
      });
      console.error("Ошибка при изменении видимости резюме:", error);
    }
  });
  
  // Функция для переключения видимости резюме
  const toggleResumeVisibility = (resumeId: number, isCurrentlyPublic: boolean | null | undefined) => {
    toggleVisibilityMutation.mutate(resumeId);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Личный кабинет</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Добро пожаловать, {user?.fullName}! Управляйте своими резюме и проектами.
              </p>
            </div>
            <Link href="/messages">
              <Button variant="outline" className="relative">
                <Inbox className="mr-2 h-4 w-4" />
                Сообщения
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
          
          <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="w-full"
          >
            <TabsList className="mb-8 flex justify-center">
              <TabsTrigger value="profile">Профиль</TabsTrigger>
              <TabsTrigger value="applicant">Соискатель</TabsTrigger>
              <TabsTrigger value="project">Проект</TabsTrigger>
              <TabsTrigger value="investor">Инвестор</TabsTrigger>
            </TabsList>
            
            {/* Вкладка Профиль */}
            <TabsContent value="profile">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Мой профиль</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Карточка со статистикой */}
                <Card>
                  <CardHeader>
                    <CardTitle>Статистика</CardTitle>
                    <CardDescription>
                      Сводка вашей активности
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Активные проекты</span>
                        <span className="text-lg font-medium dark:text-gray-100">{projectsLoading ? "-" : Array.isArray(projects) ? projects.length : 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Полученные заявки</span>
                        <span className="text-lg font-medium dark:text-gray-100">{receivedApplicationsLoading ? "-" : Array.isArray(receivedApplications) ? receivedApplications.length : 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Резюме</span>
                        <span className="text-lg font-medium dark:text-gray-100">{resumesLoading ? "-" : Array.isArray(resumes) ? resumes.length : 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Отправленные заявки</span>
                        <span className="text-lg font-medium dark:text-gray-100">{sentApplicationsLoading ? "-" : Array.isArray(sentApplications) ? sentApplications.length : 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Карточка быстрых действий */}
                <Card>
                  <CardHeader>
                    <CardTitle>Быстрые действия</CardTitle>
                    <CardDescription>
                      Создайте новый проект или резюме
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Link href="/create-project">
                        <Button className="w-full justify-start" variant="outline">
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Создать новый проект
                        </Button>
                      </Link>
                      <Link href="/create-resume">
                        <Button className="w-full justify-start" variant="outline">
                          <PlusIcon className="mr-2 h-4 w-4" />
                          Создать новое резюме
                        </Button>
                      </Link>
                      <Link href="/projects">
                        <Button className="w-full justify-start" variant="outline">
                          <Briefcase className="mr-2 h-4 w-4" />
                          Просмотреть проекты
                        </Button>
                      </Link>
                      <Link href="/messages">
                        <Button className="w-full justify-start" variant="outline">
                          <Inbox className="mr-2 h-4 w-4" />
                          Проверить сообщения
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Карточка аккаунта */}
                <Card>
                  <CardHeader>
                    <CardTitle>Информация аккаунта</CardTitle>
                    <CardDescription>
                      Данные вашего профиля
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">ФИО</div>
                        <div className="font-medium dark:text-gray-200">{user?.fullName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Логин</div>
                        <div className="font-medium dark:text-gray-200">{user?.username}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                        <div className="font-medium dark:text-gray-200">{user?.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Телефон</div>
                        <div className="font-medium dark:text-gray-200">{user?.phone}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Статус верификации</div>
                        <div className="font-medium dark:text-gray-200">{user?.verified ? "Подтвержден" : "Не подтвержден"}</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href="/edit-profile">
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        Редактировать профиль
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            {/* Вкладка Соискатель */}
            <TabsContent value="applicant">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Соискатель</h2>
              </div>
              
              {/* Вкладки для переключения между резюме и отправленными заявками */}
              <Tabs defaultValue="resumes" className="mb-6">
                <TabsList className="flex justify-center mb-6">
                  <TabsTrigger value="resumes" data-subtab="myresumes">Мои резюме</TabsTrigger>
                  <TabsTrigger value="sent-applications">Отправленные заявки</TabsTrigger>
                </TabsList>
                
                {/* Резюме */}
                <TabsContent value="resumes">
                  {resumesLoading ? (
                    <div className="flex justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !Array.isArray(resumes) || resumes.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-12">
                        <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Нет резюме</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                          У вас еще нет резюме. Создайте ваше первое резюме, чтобы откликаться на проекты!
                        </p>
                        <Link href="/create-resume">
                          <Button>Создать первое резюме</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Мои резюме</h3>
                        <Link href="/create-resume">
                          <Button>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Создать резюме
                          </Button>
                        </Link>
                      </div>
                      <div className="grid gap-6">
                        {resumes.map((resume: any) => (
                          <Card key={resume.id}>
                            <CardHeader>
                              <CardTitle>{resume.title}</CardTitle>
                              <CardDescription>
                                Создано: {new Date(resume.createdAt).toLocaleDateString('ru-RU')} • Обновлено: {new Date(resume.updatedAt).toLocaleDateString('ru-RU')}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="font-medium text-gray-900 mb-2">Направление: {resume.direction}</p>
                              <Separator className="my-4" />
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Навыки</h4>
                                <div className="flex flex-wrap gap-2">
                                  {(resume.skills || []).map((skill: string, index: number) => (
                                    <Badge key={index} variant="outline">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Образование</h4>
                                <div className="space-y-2">
                                  {(resume.education || []).slice(0, 1).map((edu: any, index: number) => (
                                    <div key={index}>
                                      <p className="font-medium">{edu.institution}</p>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">{edu.degree}, {edu.fieldOfStudy}</p>
                                      <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate || "По настоящее время"}</p>
                                    </div>
                                  ))}
                                  {resume.education?.length > 1 && (
                                    <p className="text-sm text-gray-500">+{resume.education.length - 1} еще</p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap gap-2 justify-between">
                              <div className="flex gap-2">
                                <Link href={`/talent/${resume.id}`}>
                                  <Button variant="outline">Просмотреть</Button>
                                </Link>
                                <Button 
                                  variant={resume.isPublic !== false ? "outline" : "destructive"} 
                                  onClick={() => toggleResumeVisibility(resume.id, resume.isPublic)}
                                >
                                  {resume.isPublic !== false ? "Скрыть из поиска" : "Показать в поиске"}
                                </Button>
                              </div>
                              <Link href={`/edit-resume/${resume.id}`}>
                                <Button>Редактировать</Button>
                              </Link>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* Отправленные заявки */}
                <TabsContent value="sent-applications">
                  {sentApplicationsLoading ? (
                    <div className="flex justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !Array.isArray(sentApplications) || sentApplications.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-12">
                        <Inbox className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Нет отправленных заявок</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                          Вы еще не отправили ни одной заявки на проекты. Просмотрите доступные проекты и отправьте заявку.
                        </p>
                        <Link href="/projects">
                          <Button>Просмотреть проекты</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                      {Array.isArray(sentApplications) && sentApplications.map((application: Application) => (
                        <Card key={application.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>Заявка на проект</CardTitle>
                                <CardDescription>
                                  Отправлена: {new Date(application.createdAt).toLocaleDateString('ru-RU')}
                                </CardDescription>
                              </div>
                              <Badge 
                                variant={
                                  application.status === "accepted" ? "default" : 
                                  application.status === "rejected" ? "destructive" : 
                                  "outline"
                                }
                              >
                                {application.status === "pending" ? "На рассмотрении" : 
                                 application.status === "accepted" ? "Принята" : 
                                 application.status === "rejected" ? "Отклонена" : 
                                 application.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Проект</div>
                                <div className="font-medium">
                                  <Link href={`/projects/${application.projectId}`} className="hover:text-primary hover:underline">
                                    {application.project?.title || `Проект #${application.projectId}`}
                                  </Link>
                                </div>
                                {application.project && (
                                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {application.project.description?.substring(0, 150)}
                                    {application.project.description?.length > 150 ? "..." : ""}
                                  </div>
                                )}
                                {application.positionId && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                      Позиция: {
                                        application.project?.positions?.find((p: any) => p.id === application.positionId)?.title ||
                                        `Позиция #${application.positionId}`
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Резюме</div>
                                <div className="font-medium">
                                  {application.resume ? (
                                    <Link href={`/talent/${application.resumeId}`} className="hover:text-primary hover:underline">
                                      {application.resume.title}
                                    </Link>
                                  ) : (
                                    `Резюме #${application.resumeId}`
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Сообщение</div>
                                <div className="text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                  {application.message}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Link href={`/projects/${application.projectId}`}>
                              <Button variant="outline">Перейти к проекту</Button>
                            </Link>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            {/* Вкладка Проект */}
            <TabsContent value="project">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Проект</h2>
              </div>
              
              {/* Вкладки для переключения между проектами и полученными заявками */}
              <Tabs defaultValue="projects" className="mb-6">
                <TabsList className="flex justify-center mb-6">
                  <TabsTrigger value="projects" data-subtab="myprojects">Мои проекты</TabsTrigger>
                  <TabsTrigger value="received-applications">Полученные заявки</TabsTrigger>
                </TabsList>
                
                {/* Проекты */}
                <TabsContent value="projects">
                  {projectsLoading ? (
                    <div className="flex justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !Array.isArray(projects) || projects.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-12">
                        <Briefcase className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Нет проектов</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                          У вас еще нет проектов. Создайте ваш первый проект, чтобы найти талантливых людей!
                        </p>
                        <Link href="/create-project">
                          <Button>Создать первый проект</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Мои проекты</h3>
                        <Link href="/create-project">
                          <Button>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Создать проект
                          </Button>
                        </Link>
                      </div>
                      <div className="grid gap-6">
                        {projects.map((project: any) => (
                          <Card key={project.id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle>{project.title}</CardTitle>
                                  <CardDescription>Создано: {new Date(project.createdAt).toLocaleDateString('ru-RU')}</CardDescription>
                                </div>
                                <Badge>{project.field}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">{project.description}</p>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {Array.isArray(project.positions) ? project.positions.map((position: any, index: number) => (
                                  <Badge key={index} variant="outline">{position.title}</Badge>
                                )) : null}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="mr-4">
                                  {project.remote ? "Удаленно" : project.location || "Расположение не указано"}
                                </span>
                                <span>{(project.applications || []).length} заявок</span>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                              <Link href={`/projects/${project.id}`}>
                                <Button variant="outline">Просмотреть</Button>
                              </Link>
                              <Link href={`/projects/${project.id}/edit`}>
                                <Button>Редактировать</Button>
                              </Link>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* Полученные заявки */}
                <TabsContent value="received-applications">
                  {receivedApplicationsLoading ? (
                    <div className="flex justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !Array.isArray(receivedApplications) || receivedApplications.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-12">
                        <Inbox className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Нет полученных заявок</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                          Вы еще не получили заявок на ваши проекты. Убедитесь, что ваши проекты видны в поиске.
                        </p>
                        <Link href="/projects">
                          <Button>Просмотреть ваши проекты</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                      {Array.isArray(receivedApplications) && receivedApplications.map((application: Application) => (
                        <Card key={application.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>Заявка от {application.user?.username || `пользователя #${application.userId}`}</CardTitle>
                                <CardDescription>
                                  Создана: {new Date(application.createdAt).toLocaleDateString('ru-RU')}
                                </CardDescription>
                              </div>
                              <Badge 
                                variant={
                                  application.status === "accepted" ? "default" : 
                                  application.status === "rejected" ? "destructive" : 
                                  "outline"
                                }
                              >
                                {application.status === "pending" ? "На рассмотрении" : 
                                 application.status === "accepted" ? "Принята" : 
                                 application.status === "rejected" ? "Отклонена" : 
                                 application.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Проект</div>
                                <div className="font-medium">
                                  <Link href={`/projects/${application.projectId}`} className="hover:text-primary hover:underline">
                                    {projects?.find(p => p.id === application.projectId)?.title || `Проект #${application.projectId}`}
                                  </Link>
                                </div>
                                {application.positionId && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                      Позиция: {
                                        projects?.find(p => p.id === application.projectId)?.positions?.find((pos: any) => pos.id === application.positionId)?.title ||
                                        `Позиция #${application.positionId}`
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Кандидат</div>
                                <div className="font-medium">
                                  <Link href={`/talent/${application.resume?.id}`} className="hover:text-primary hover:underline">
                                    {application.user?.fullName || application.user?.username || `Пользователь #${application.userId}`}
                                  </Link>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Резюме кандидата</div>
                                {application.resume ? (
                                  <div>
                                    <div className="font-medium">
                                      <Link href={`/talent/${application.resume.id}`} className="hover:text-primary hover:underline">
                                        {application.resume.title}
                                      </Link>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                      <span className="font-medium">Направление:</span> {application.resume.direction}
                                    </div>
                                    
                                    {/* Образование */}
                                    {Array.isArray(application.resume.education) && application.resume.education.length > 0 && (
                                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        <span className="font-medium">Образование:</span> {application.resume.education[0].institution}
                                        {application.resume.education.length > 1 && (
                                          <span className="text-xs text-gray-400 ml-1">+{application.resume.education.length - 1} ещё</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Опыт работы */}
                                    {Array.isArray(application.resume.experience) && application.resume.experience.length > 0 && (
                                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        <span className="font-medium">Опыт:</span> {application.resume.experience[0].position} в {application.resume.experience[0].company}
                                        {application.resume.experience.length > 1 && (
                                          <span className="text-xs text-gray-400 ml-1">+{application.resume.experience.length - 1} ещё</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Навыки */}
                                    {Array.isArray(application.resume.skills) && application.resume.skills.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {application.resume.skills.slice(0, 3).map((skill, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                                        ))}
                                        {application.resume.skills.length > 3 && (
                                          <span className="text-xs text-gray-400">+{application.resume.skills.length - 3} ещё</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-600 dark:text-gray-300">
                                    Резюме #{application.resumeId} (информация недоступна)
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm text-gray-500 mb-1">Сообщение</div>
                                <div className="text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                  {application.message}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <div className="flex gap-2">
                              {application.status === "pending" && (
                                <>
                                  <Button 
                                    variant="default" 
                                    onClick={() => {
                                      updateApplicationStatusMutation.mutate({ 
                                        id: application.id, 
                                        status: "accepted" 
                                      });
                                    }}
                                  >
                                    Принять
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => {
                                      updateApplicationStatusMutation.mutate({ 
                                        id: application.id, 
                                        status: "rejected" 
                                      });
                                    }}
                                  >
                                    Отклонить
                                  </Button>
                                </>
                              )}
                            </div>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                // Здесь будет логика отправки сообщения
                                console.log("Отправить сообщение", application.userId);
                              }}
                            >
                              Написать сообщение
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            {/* Вкладка Инвестор */}
            <TabsContent value="investor">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Инвестор</h2>
              </div>
              
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Раздел в разработке</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                    Данный раздел находится в разработке и будет доступен в ближайшее время.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}