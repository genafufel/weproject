import { useQuery } from "@tanstack/react-query";
import { useLocation, Link, useRoute } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveReturnUrl } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Mail, Calendar, Building, GraduationCap, Edit, Image } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Resume } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Переводы для полей направлений
const directionTranslations: Record<string, string> = {
  "Computer Science": "Компьютерные науки",
  "Information Technology": "Информационные технологии",
  "Graphic Design": "Графический дизайн",
  "UX/UI Design": "UX/UI дизайн",
  "Business Administration": "Бизнес-администрирование",
  "Marketing": "Маркетинг",
  "Finance": "Финансы",
  "Education": "Образование",
  "Engineering": "Инженерия",
  "Arts": "Искусство",
  "Event Management": "Организация мероприятий",
  "Health Sciences": "Медицинские науки",
  "Other": "Другое",
};

// Интерфейс для расширенного резюме с пользовательскими данными
interface ResumeWithUser extends Resume {
  user?: {
    id: number;
    fullName: string;
    avatar?: string | null;
  }
}

// Интерфейс для пользователя
interface User {
  id: number;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string | null;
  userType?: string;
}

export default function TalentDetail() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  
  // State для контактной формы
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Extract resume ID from the URL
  const resumeId = parseInt(location.split("/")[2]);
  
  // Получаем резюме с сервера через публичный API
  const {
    data: resume,
    isLoading,
    error,
  } = useQuery<Resume>({
    queryKey: [`/api/public/resumes/${resumeId}`],
    queryFn: async () => {
      const res = await fetch(`/api/public/resumes/${resumeId}`);
      
      if (!res.ok) {
        throw new Error(`Не удалось загрузить резюме: ${res.status}`);
      }
      
      return res.json();
    }
  });
  
  // Получаем данные о пользователе, которому принадлежит резюме (API уже публичное)
  const { data: resumeUser } = useQuery<User>({
    queryKey: [`/api/users/${resume?.userId}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${resume?.userId}`);
      
      if (!res.ok) {
        throw new Error(`Не удалось загрузить данные пользователя: ${res.status}`);
      }
      
      return res.json();
    },
    enabled: !!resume?.userId,
  });
  
  // Преобразуем навыки в массив
  const getSkills = (resume?: Resume): string[] => {
    if (!resume?.skills) return [];
    
    try {
      if (typeof resume.skills === 'string') {
        return JSON.parse(resume.skills);
      }
      if (Array.isArray(resume.skills)) {
        return resume.skills.filter(skill => typeof skill === 'string');
      }
    } catch (e) {
      console.error("Ошибка при обработке навыков:", e);
    }
    
    return [];
  };
  
  // Преобразуем таланты в массив
  const getTalents = (resume?: Resume): Record<string, any> => {
    if (!resume?.talents) return {};
    
    try {
      if (typeof resume.talents === 'string') {
        return JSON.parse(resume.talents);
      }
      return resume.talents;
    } catch (e) {
      console.error("Ошибка при обработке талантов:", e);
    }
    
    return {};
  };
  
  // Преобразуем образование в массив
  const getEducation = (resume?: Resume): any[] => {
    if (!resume?.education) return [];
    
    try {
      if (typeof resume.education === 'string') {
        return JSON.parse(resume.education);
      }
      if (Array.isArray(resume.education)) {
        return resume.education;
      }
    } catch (e) {
      console.error("Ошибка при обработке образования:", e);
    }
    
    return [];
  };
  
  // Преобразуем опыт работы в массив
  const getExperience = (resume?: Resume): any[] => {
    if (!resume?.experience) return [];
    
    try {
      if (typeof resume.experience === 'string') {
        return JSON.parse(resume.experience);
      }
      if (Array.isArray(resume.experience)) {
        return resume.experience;
      }
    } catch (e) {
      console.error("Ошибка при обработке опыта работы:", e);
    }
    
    return [];
  };
  
  // Format date
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };
  
  // Функция отправки сообщения
  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Для отправки сообщений необходимо войти в систему",
        variant: "destructive",
      });
      return;
    }
    
    if (!resumeUser || !messageText.trim()) {
      toast({
        title: "Ошибка отправки",
        description: "Пожалуйста, введите текст сообщения",
        variant: "destructive",
      });
      return;
    }
    
    setSendingMessage(true);
    
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: resumeUser.id,
          content: messageText,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Не удалось отправить сообщение");
      }
      
      toast({
        title: "Сообщение отправлено",
        description: `Ваше сообщение успешно отправлено ${resumeUser.fullName}`,
      });
      
      setMessageText("");
    } catch (error) {
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить сообщение. Пожалуйста, попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Проверяем, является ли текущий пользователь владельцем резюме
  const isResumeOwner = user && resumeUser && user.id === resumeUser.id;
  
  // Если данные загружаются, показываем индикатор загрузки
  if (isLoading) {
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
  
  // Если произошла ошибка или резюме не найдено
  if (error || !resume) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Резюме не найдено</h1>
            <p className="text-gray-600 mb-8">Запрашиваемое резюме не существует или было удалено.</p>
            <Button asChild>
              <Link href="/talent">Просмотреть все резюме</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Получаем навыки
  const skills = getSkills(resume);
  
  // Получаем таланты
  const talents: string[] = Array.isArray(resume.talents) 
    ? resume.talents as string[]
    : (typeof resume.talents === 'string' ? JSON.parse(resume.talents as string) : []);
  
  // Получаем образование
  const education = getEducation(resume);
  
  // Получаем опыт работы
  const experience = getExperience(resume);
  
  // Получаем фотографии резюме
  const photos = Array.isArray(resume.photos) ? resume.photos : [];
  console.log("Фотографии резюме:", photos);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="pl-0">
              <Link href="/talent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад к списку талантов
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={resumeUser?.avatar || undefined} alt={resumeUser?.fullName} />
                      <AvatarFallback className="text-xl">
                        {resumeUser?.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h1 className="text-2xl font-bold text-gray-900">{resumeUser?.fullName}</h1>
                    <p className="text-primary font-medium">{resume.title}</p>
                    <p className="text-gray-500 mt-1">
                      {directionTranslations[resume.direction] || resume.direction}
                    </p>
                    
                    <div className="mt-6 w-full space-y-2">
                      {/* Если пользователь владелец резюме, показываем кнопку редактирования */}
                      {isResumeOwner && (
                        <Button className="w-full" asChild>
                          <Link href={`/create-resume?id=${resume.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Редактировать резюме
                          </Link>
                        </Button>
                      )}
                      
                      {/* Для других пользователей показываем кнопку отправки сообщения */}
                      {!isResumeOwner && user && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full">
                              <Mail className="mr-2 h-4 w-4" />
                              Связаться
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Отправка сообщения</DialogTitle>
                              <DialogDescription>
                                Отправить сообщение пользователю {resumeUser?.fullName}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-4">
                              <Textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Введите ваше сообщение..."
                                className="resize-none"
                                rows={5}
                              />
                            </div>
                            
                            <DialogFooter>
                              <Button 
                                onClick={handleSendMessage} 
                                disabled={sendingMessage || !messageText.trim()}
                              >
                                {sendingMessage ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Отправка...
                                  </>
                                ) : (
                                  "Отправить"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {/* Если пользователь не авторизован */}
                      {!user && (
                        <Button 
                          className="w-full"
                          onClick={() => {
                            saveReturnUrl(location);
                            window.location.href = "/auth";
                          }}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Войдите, чтобы связаться
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Skills card */}
              <Card>
                <CardHeader>
                  <CardTitle>Навыки</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} className="bg-primary text-white hover:bg-primary/90">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Special talents card */}
              {talents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Особые таланты</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {talents.map((talent: string, index: number) => (
                        <Badge key={index} className="bg-primary text-white hover:bg-primary/90">{talent}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Resume details */}
              <Card>
                <CardHeader>
                  <CardTitle>Детали резюме</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Создано</span>
                    <span>{resume.createdAt ? formatDate(resume.createdAt) : ""}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Направление</span>
                    <span>{directionTranslations[resume.direction] || resume.direction}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Portfolio photos section */}
              {photos.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center">
                      <Image className="mr-2 h-5 w-5 text-primary" />
                      Портфолио
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="overflow-hidden rounded-md aspect-video">
                          <img 
                            src={photo} 
                            alt={`Портфолио ${index + 1}`} 
                            className="object-cover w-full h-full transition-transform hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Education section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5 text-primary" />
                    Образование
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {education.length > 0 ? (
                    education.map((edu, index) => (
                      <div key={index} className={index > 0 ? "mt-6 pt-6 border-t border-gray-200" : ""}>
                        <div className="flex justify-between">
                          <h3 className="text-lg font-medium text-gray-900">{edu.institution}</h3>
                          <span className="text-gray-500 text-sm">
                            {edu.startDate} - {edu.endDate || "Настоящее время"}
                          </span>
                        </div>
                        <p className="text-primary">
                          {edu.degree} по направлению {edu.fieldOfStudy}
                        </p>
                        {edu.description && (
                          <p className="mt-2 text-gray-600">{edu.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Информация об образовании не указана</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Experience section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <Building className="mr-2 h-5 w-5 text-primary" />
                    Опыт работы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {experience.length > 0 ? (
                    experience.map((exp, index) => (
                      <div key={index} className={index > 0 ? "mt-6 pt-6 border-t border-gray-200" : ""}>
                        <div className="flex justify-between">
                          <h3 className="text-lg font-medium text-gray-900">{exp.company}</h3>
                          <span className="text-gray-500 text-sm">
                            {exp.startDate} - {exp.endDate || "Настоящее время"}
                          </span>
                        </div>
                        <p className="text-primary">{exp.position}</p>
                        {exp.description && (
                          <p className="mt-2 text-gray-600">{exp.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Информация об опыте работы не указана</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Projects CTA for project owners */}
              {user && !isResumeOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ищете таланты как {resumeUser?.fullName.split(' ')[0]}?</CardTitle>
                    <CardDescription>
                      Разместите проект, чтобы найти талантливых специалистов, 
                      которые соответствуют вашим требованиям.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <Link href="/create-project">Создать проект</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
