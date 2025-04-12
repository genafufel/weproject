import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link, useRoute } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { saveReturnUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UniversalImage, UserAvatar, ProjectImage } from "@/components/ui/universal-image";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Calendar, 
  Briefcase, 
  ArrowLeft, 
  Loader2, 
  Image as ImageIcon, 
  Edit as EditIcon 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function ProjectDetail() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  
  // Extract project ID from the URL
  const projectId = parseInt(location.split("/")[2]);
  
  // Fetch project details
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery<any>({
    queryKey: [`/api/projects/${projectId}`],
  });
  
  // Fetch project owner info
  const {
    data: projectOwner,
    isLoading: ownerLoading,
  } = useQuery<any>({
    queryKey: [`/api/users/${project?.userId}`],
    enabled: !!project?.userId,
  });
  
  // Fetch user's resumes for application
  const {
    data: resumes = [],
    isLoading: resumesLoading,
  } = useQuery<any[]>({
    queryKey: [`/api/resumes?userId=${user?.id}`],
    enabled: !!user,
  });
  
  // Check if user has already applied for this project
  const {
    data: userApplications = [],
    isLoading: applicationsLoading,
  } = useQuery<any[] | null>({
    queryKey: [`/api/applications?projectId=${projectId}&userId=${user?.id}`],
    enabled: !!user,
    queryFn: getQueryFn<any[] | null>({ on401: "returnNull" }) as any
  });
  
  // Determine if user has already applied
  const hasApplied = userApplications && 
    Array.isArray(userApplications) && 
    userApplications.length > 0;
  
  // Set default resume when resumes are loaded
  useEffect(() => {
    if (resumes && resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes, selectedResumeId]);
  
  // Apply for project mutation
  const applyMutation = useMutation({
    mutationFn: async (applicationData: { projectId: number; resumeId: number; message: string }) => {
      const res = await apiRequest("POST", "/api/applications", applicationData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications?projectId=${projectId}&userId=${user?.id}`] });
      toast({
        title: "Заявка отправлена",
        description: "Ваш отклик был отправлен владельцу проекта.",
      });
      setApplyDialogOpen(false);
      setApplicationMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при отправке заявки",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Комментарий был добавлен к состоянию для выбранной позиции выше

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Handle apply button click
  const handleApply = () => {
    if (!user) {
      saveReturnUrl(location);
      navigate("/auth");
      return;
    }
    
    // Проверка на владельца проекта (не может откликаться на свой же проект)
    if (project?.userId === user.id) {
      toast({
        title: "Не можете откликнуться на собственный проект",
        description: "Вы не можете подать заявку на свой собственный проект.",
        variant: "destructive",
      });
      return;
    }
    
    setApplyDialogOpen(true);
  };
  
  // Handle application submission
  const handleSubmitApplication = () => {
    if (!selectedResumeId) {
      toast({
        title: "Резюме обязательно",
        description: "Пожалуйста, выберите резюме для вашего отклика.",
        variant: "destructive",
      });
      return;
    }
    
    applyMutation.mutate({
      projectId,
      resumeId: selectedResumeId,
      message: applicationMessage,
    });
  };
  
  // Обработчик для клика на позицию
  const handlePositionClick = (position: string) => {
    setSelectedPosition(position);
    setApplyDialogOpen(true);
  };

  // Загрузка
  if (projectLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }
  
  // Ошибка
  if (projectError || !project) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Проект не найден</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Проект, который вы ищете, не существует или был удален.</p>
            <Button asChild>
              <Link href="/projects">Просмотреть все проекты</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="pl-0">
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад к проектам
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project header */}
              <div className="bg-white dark:bg-gray-700/70 rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{project?.title || 'Проект'}</h1>
                    <div className="flex items-center mt-2 text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="text-sm">Опубликовано {project?.createdAt ? formatDate(project.createdAt) : ''}</span>
                    </div>
                  </div>
                  <Badge className="text-sm">{project?.field || ''}</Badge>
                </div>
                
                <div className="flex items-center mt-4">
                  <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-1" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {project?.remote ? "Удаленно" : project?.location || "Место не указано"}
                  </span>
                </div>
              </div>
              
              {/* Project photos */}
              {project?.photos && project.photos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Фотографии проекта</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Carousel className="w-full">
                      <CarouselContent>
                        {project.photos.map((photo: string, index: number) => (
                          <CarouselItem key={index} className="basis-full md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                              <div className="overflow-hidden rounded-lg">
                                <ProjectImage 
                                  src={photo} 
                                  alt={`Фото проекта ${index + 1}`} 
                                  className="h-52 w-full transition-all hover:scale-105"
                                />
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  </CardContent>
                </Card>
              )}
              
              {/* Project description */}
              <Card>
                <CardHeader>
                  <CardTitle>Описание проекта</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-blue max-w-none dark:prose-invert">
                    <p className="whitespace-pre-line dark:text-gray-200">{project?.description || 'Описание отсутствует'}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Positions */}
              <Card>
                <CardHeader>
                  <CardTitle>Доступные позиции</CardTitle>
                  <CardDescription>
                    Проект ищет следующие роли:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {(project?.positions || []).map((position: string, index: number) => (
                      <li key={index} className="flex items-start justify-between border-b pb-2">
                        <div className="flex items-start">
                          <Briefcase className="h-5 w-5 text-primary mr-2 mt-0.5" />
                          <span>{position}</span>
                        </div>
                        {user ? (
                          hasApplied ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Вы откликнулись
                            </Badge>
                          ) : (
                            project?.userId !== user.id && (
                              <Button 
                                size="sm" 
                                onClick={() => handlePositionClick(position)}
                                variant="outline"
                              >
                                Откликнуться
                              </Button>
                            )
                          )
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              saveReturnUrl(location);
                              navigate("/auth");
                            }}
                            variant="outline"
                          >
                            Войти
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Требования</CardTitle>
                  <CardDescription>
                    Навыки и квалификации, необходимые для этого проекта:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(project?.requirements || []).map((requirement: string, index: number) => (
                      <Badge key={index} className="bg-primary text-white hover:bg-primary/90">{requirement}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Action card */}
              <Card>
                <CardHeader>
                  <CardTitle>Заинтересовались проектом?</CardTitle>
                  <CardDescription>
                    Подайте заявку, чтобы связаться с владельцем проекта.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user ? (
                    project?.userId === user.id ? (
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 rounded-lg">
                        Это ваш проект
                      </div>
                    ) : (
                      hasApplied ? (
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                          Вы уже подали заявку на этот проект.
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={handleApply}
                          disabled={applicationsLoading}
                        >
                          Откликнуться на проект
                        </Button>
                      )
                    )
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        saveReturnUrl(location);
                        navigate("/auth");
                      }}
                    >
                      Войдите, чтобы откликнуться
                    </Button>
                  )}
                </CardContent>
                {!hasApplied && user && project?.userId !== user.id && !resumes?.length && (
                  <CardFooter className="border-t pt-4">
                    <div className="w-full text-center text-sm">
                      <p className="text-gray-500 dark:text-gray-400 mb-2">Сначала создайте резюме.</p>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/create-resume">Создать резюме</Link>
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
              
              {/* Project owner card */}
              <Card>
                <CardHeader>
                  <CardTitle>Владелец проекта</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={projectOwner?.avatar} alt={projectOwner?.fullName || "Владелец проекта"} />
                      <AvatarFallback>
                        {projectOwner?.fullName
                          ? projectOwner.fullName.slice(0, 2).toUpperCase()
                          : "ВП"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{projectOwner?.fullName || "Владелец проекта"}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{projectOwner?.bio || "Информация отсутствует"}</p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {user ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/messages?userId=${project?.userId || ''}`}>
                        Написать владельцу проекта
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => {
                        saveReturnUrl(location);
                        navigate("/auth");
                      }}
                    >
                      Войдите, чтобы написать сообщение
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              {/* Share this project card */}
              <Card>
                <CardHeader>
                  <CardTitle>Поделиться проектом</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-around">
                    <Button variant="outline" size="icon">
                      <svg viewBox="0 0 24 24" className="h-5 w-5">
                        <path fill="currentColor" d="M22.162 5.656a8.384 8.384 0 0 1-2.402.658A4.196 4.196 0 0 0 21.6 4c-.82.488-1.719.83-2.656 1.015a4.182 4.182 0 0 0-7.126 3.814 11.874 11.874 0 0 1-8.62-4.37 4.168 4.168 0 0 0-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 0 1-1.894-.523v.052a4.185 4.185 0 0 0 3.355 4.101 4.21 4.21 0 0 1-1.89.072A4.185 4.185 0 0 0 7.97 16.65a8.394 8.394 0 0 1-6.191 1.732 11.83 11.83 0 0 0 6.41 1.88c7.693 0 11.9-6.373 11.9-11.9 0-.18-.005-.362-.013-.54a8.496 8.496 0 0 0 2.087-2.165z"/>
                      </svg>
                    </Button>
                    <Button variant="outline" size="icon">
                      <svg viewBox="0 0 24 24" className="h-5 w-5">
                        <path fill="currentColor" d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/>
                      </svg>
                    </Button>
                    <Button variant="outline" size="icon">
                      <svg viewBox="0 0 24 24" className="h-5 w-5">
                        <path fill="currentColor" d="M18.335 18.339H15.67v-4.177c0-.996-.02-2.278-1.39-2.278-1.389 0-1.601 1.084-1.601 2.205v4.25h-2.666V9.75h2.56v1.17h.035c.358-.674 1.228-1.387 2.528-1.387 2.7 0 3.2 1.778 3.2 4.091v4.715zM7.003 8.575a1.546 1.546 0 01-1.548-1.549 1.548 1.548 0 111.547 1.549zm1.336 9.764H5.666V9.75H8.34v8.589zM19.67 3H4.329C3.593 3 3 3.58 3 4.297v15.406C3 20.42 3.594 21 4.328 21h15.338C20.4 21 21 20.42 21 19.703V4.297C21 3.58 20.4 3 19.666 3z"/>
                      </svg>
                    </Button>
                    <Button variant="outline" size="icon">
                      <svg viewBox="0 0 24 24" className="h-5 w-5">
                        <path fill="currentColor" d="M8.51 20h-.08a10.87 10.87 0 0 1-4.65-1.09A1.38 1.38 0 0 1 3 17.47a1.41 1.41 0 0 1 1.16-1.18 6.63 6.63 0 0 0 2.54-.89 9.49 9.49 0 0 1-3.51-9.07 1.41 1.41 0 0 1 1-1.15 1.35 1.35 0 0 1 1.43.41 7.09 7.09 0 0 0 4.88 2.75V8a4.5 4.5 0 0 1 4.5-4.5 4.4 4.4 0 0 1 3.28 1.49 8.91 8.91 0 0 0 2.12-.64 1.39 1.39 0 0 1 1.45.23 1.39 1.39 0 0 1 .32 1.46 9.59 9.59 0 0 1-1.84 3.07 1.41 1.41 0 0 1-1.07.54h-.16a9.58 9.58 0 0 1-1.89-.34 9.9 9.9 0 0 1-6.62 9.18A1.4 1.4 0 0 1 8.51 20Z"/>
                      </svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Edit button for project owner */}
              {user && project?.userId === user.id && (
                <Card>
                  <CardContent className="pt-6">
                    <Button className="w-full" variant="outline" asChild>
                      <Link href={`/projects/${project?.id}/edit`}>
                        <EditIcon className="h-4 w-4 mr-2" />
                        Редактировать проект
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="sm:max-w-[500px] dark:text-gray-200">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              {selectedPosition 
                ? `Отклик на позицию "${selectedPosition}"` 
                : `Отклик на проект "${project?.title || 'Проект'}"`}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Отправьте заявку, чтобы принять участие в проекте. Выберите резюме и добавьте сопроводительное сообщение.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="resume" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Выберите резюме
              </label>
              
              {resumesLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Загрузка ваших резюме...</span>
                </div>
              ) : !resumes?.length ? (
                <div className="text-sm text-red-500 dark:text-red-400">
                  У вас нет резюме. Пожалуйста, создайте его сначала.
                </div>
              ) : (
                <Select
                  value={selectedResumeId?.toString()}
                  onValueChange={(value) => setSelectedResumeId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите резюме" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume: any) => (
                      <SelectItem key={resume.id} value={resume.id.toString()}>
                        {resume.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Сопроводительное сообщение (необязательно)
              </label>
              <Textarea
                id="message"
                placeholder="Расскажите о себе и почему вы заинтересованы в этом проекте..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApplyDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={!selectedResumeId || applyMutation.isPending || !resumes?.length}
            >
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                "Отправить отклик"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
