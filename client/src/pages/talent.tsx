import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ChevronDown, GraduationCap, Briefcase, Mail, Edit, Phone } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { Resume } from "@shared/schema";

// Field directions for filtering
const fieldDirections = [
  { value: "all", label: "Все направления" },
  { value: "Computer Science", label: "Компьютерные науки" },
  { value: "Information Technology", label: "Информационные технологии" },
  { value: "Graphic Design", label: "Графический дизайн" },
  { value: "UX/UI Design", label: "UX/UI дизайн" },
  { value: "Business Administration", label: "Бизнес-администрирование" },
  { value: "Marketing", label: "Маркетинг" },
  { value: "Finance", label: "Финансы" },
  { value: "Education", label: "Образование" },
  { value: "Engineering", label: "Инженерия" },
  { value: "Arts", label: "Искусство" },
  { value: "Event Management", label: "Организация мероприятий" },
  { value: "Health Sciences", label: "Медицинские науки" },
  { value: "Other", label: "Другое" },
];

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

export default function Talent() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State для контактной формы
  const [selectedContact, setSelectedContact] = useState<{ userId: number; fullName: string; } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Parse URL parameters
  const params = new URLSearchParams(location.split("?")[1] || "");
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState(params.get("search") || "");
  const [selectedField, setSelectedField] = useState(params.get("field") || "all");
  
  // Build query string for API
  const buildQueryString = () => {
    const queryParams = new URLSearchParams();
    
    if (searchTerm) queryParams.append("search", searchTerm);
    if (selectedField && selectedField !== "all") queryParams.append("field", selectedField);
    
    return queryParams.toString();
  };
  
  // Update URL with filters
  const updateUrlWithFilters = () => {
    const queryString = buildQueryString();
    setLocation(queryString ? `/talent?${queryString}` : "/talent", { replace: true });
  };
  
  // Fetch all resumes from public API (we'll filter them locally)
  const {
    data: resumes,
    isLoading,
    error,
  } = useQuery<Resume[]>({
    queryKey: ["/api/public/resumes"],
    queryFn: async () => {
      const res = await fetch("/api/public/resumes");
      
      if (!res.ok) {
        throw new Error("Failed to fetch resumes");
      }
      
      const data = await res.json();
      console.log("Получены данные о всех резюме:", data);
      return data;
    },
  });
  
  // Fetch user data for resumes
  const { data: userData } = useQuery<Record<number, any>>({
    queryKey: ["resumeUserData"],
    queryFn: async () => {
      if (!resumes || resumes.length === 0) return {};
      
      // Create a map of userId -> user data
      const userMap: Record<number, any> = {};
      
      // Get unique user IDs without using Set to avoid compilation issues
      const userIds: number[] = [];
      resumes.forEach(resume => {
        if (!userIds.includes(resume.userId)) {
          userIds.push(resume.userId);
        }
      });
      
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const res = await fetch(`/api/users/${userId}`);
            if (res.ok) {
              const userData = await res.json();
              userMap[userId] = userData;
            }
          } catch (err) {
            console.error(`Failed to fetch user data for user ${userId}:`, err);
          }
        })
      );
      
      return userMap;
    },
    enabled: !!resumes && resumes.length > 0,
  });
  
  // Filter resumes based on search and field
  const filteredResumes = resumes?.filter(resume => {
    const matchesSearch = !searchTerm || 
      resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof resume.skills === 'object' && 
        Array.isArray(resume.skills) && 
        resume.skills.some(skill => 
          typeof skill === 'string' && 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    
    const matchesField = selectedField === "all" || resume.direction === selectedField;
    
    return matchesSearch && matchesField;
  }) || [];
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlWithFilters();
  };
  
  // Handle field change
  const handleFieldChange = (value: string) => {
    setSelectedField(value);
    setTimeout(updateUrlWithFilters, 0);
  };

  // Add skills type guard
  const getResumeSkills = (resume: Resume): string[] => {
    if (!resume.skills) return [];
    
    try {
      if (typeof resume.skills === 'string') {
        return JSON.parse(resume.skills);
      }
      if (Array.isArray(resume.skills)) {
        return resume.skills.filter(skill => typeof skill === 'string');
      }
    } catch (e) {
      console.error("Failed to parse skills", e);
    }
    
    return [];
  };

  // Helper to get resume photos
  const getResumePhotos = (resume: Resume): string[] => {
    console.log("Получение фотографий для резюме:", resume.id, "photos =", resume.photos);
    
    if (!resume.photos) return [];
    
    try {
      if (typeof resume.photos === 'string') {
        return JSON.parse(resume.photos);
      }
      if (Array.isArray(resume.photos)) {
        const result = resume.photos;
        console.log("Возвращаем массив фотографий:", result);
        return result;
      }
    } catch (e) {
      console.error("Failed to parse photos", e);
    }
    
    return [];
  };

  // Helper to display education
  const getEducationDisplay = (resume: Resume) => {
    if (!resume.education) return null;
    
    let educationArray: any[] = [];
    try {
      if (typeof resume.education === 'string') {
        educationArray = JSON.parse(resume.education);
      } else if (Array.isArray(resume.education)) {
        educationArray = resume.education;
      }
    } catch (e) {
      console.error("Failed to parse education", e);
      return null;
    }
    
    if (!educationArray || educationArray.length === 0) return null;
    
    const latestEducation = educationArray[0];
    return latestEducation?.institution ? (
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <GraduationCap className="h-3 w-3" />
        <span>{latestEducation.institution}</span>
      </div>
    ) : null;
  };
  
  // Функция для отправки сообщения
  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Для отправки сообщений необходимо войти в систему",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedContact || !messageText.trim()) {
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
          receiverId: selectedContact.userId,
          content: messageText,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Не удалось отправить сообщение");
      }
      
      toast({
        title: "Сообщение отправлено",
        description: `Ваше сообщение успешно отправлено ${selectedContact.fullName}`,
      });
      
      setMessageText("");
      setSelectedContact(null);
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Hero section */}
        <div className="bg-primary text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold mb-4">Найти талантливых сотрудников</h1>
              <p className="text-blue-100 text-lg mb-8">
                Откройте для себя мотивированных студентов и молодых специалистов со свежими идеями и навыками.
              </p>
              
              {/* Search form */}
              <form onSubmit={handleSearchSubmit} className="flex w-full gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Поиск по названию, навыкам или направлению"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-0"
                  />
                </div>
                <Button type="submit" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
                  Поиск
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Filters section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Фильтры:</span>
                
                <Select value={selectedField} onValueChange={handleFieldChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Область изучения" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldDirections.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{`${filteredResumes.length} результатов`}</span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      Сортировка
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Сортировать по</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked>
                      Релевантности
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Последней активности
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resume list */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Не удалось загрузить резюме. Пожалуйста, попробуйте позже.</p>
            </div>
          ) : !filteredResumes.length ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Результаты не найдены</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Мы не смогли найти резюме, соответствующие критериям поиска.
              </p>
              <Button asChild variant="outline">
                <Link href="/talent">Очистить все фильтры</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredResumes.map((resume) => {
                const skills = getResumeSkills(resume);
                const resumeUser = userData?.[resume.userId];
                const isOwnResume = user && resumeUser && user.id === resume.userId;
                
                const photos = getResumePhotos(resume);
                const hasPhoto = photos.length > 0;
                
                return (
                  <Card key={resume.id} className={`overflow-hidden hover:shadow-md transition-all ${hasPhoto ? '' : 'flex flex-col'}`}>
                    {hasPhoto && (
                      <Link href={`/talent/${resume.id}`} className="cursor-pointer block">
                        <div className="aspect-[16/9] w-full overflow-hidden">
                          <img 
                            src={photos[0]} 
                            alt={`Фото из портфолио ${resume.title}`} 
                            className="w-full h-full object-cover transition-all hover:scale-105"
                          />
                        </div>
                      </Link>
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Link href={`/talent/${resume.id}`} className="hover:underline">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{resume.title}</h3>
                        </Link>
                        
                        {isOwnResume && (
                          <Link href={`/edit-resume/${resume.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Редактировать резюме</span>
                            </Button>
                          </Link>
                        )}
                      </div>
                      
                      {resume.direction && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {directionTranslations[resume.direction] || resume.direction}
                        </p>
                      )}
                      
                      {resumeUser && (
                        <div className="flex items-center mt-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary dark:text-primary truncate">
                              {resumeUser.fullName}
                            </p>
                            {getEducationDisplay(resume)}
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent className={`pb-4 ${!hasPhoto ? 'flex-grow' : ''}`}>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {skills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} className="bg-primary text-white hover:bg-primary/90">
                            {skill}
                          </Badge>
                        ))}
                        {skills.length > 5 && (
                          <Badge className="bg-primary text-white hover:bg-primary/90">
                            +{skills.length - 5} ещё
                          </Badge>
                        )}
                      </div>
                      {hasPhoto && photos.length > 1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          +{photos.length - 1} ещё {photos.length - 1 === 1 ? 'фото' : 'фото'} в портфолио
                        </p>
                      )}
                    </CardContent>
                    
                    <CardFooter className="pt-0 flex justify-between mt-auto">
                      {!isOwnResume && resumeUser && user && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="flex items-center gap-1"
                              onClick={() => setSelectedContact({ userId: resumeUser.id, fullName: resumeUser.fullName })}
                            >
                              <Mail className="h-4 w-4" />
                              Связаться
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Сообщение для {resumeUser.fullName}</DialogTitle>
                              <DialogDescription>
                                Отправьте сообщение автору резюме, чтобы обсудить возможное сотрудничество.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <Textarea
                                placeholder="Введите ваше сообщение здесь..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                className="min-h-[120px]"
                              />
                            </div>
                            <DialogFooter>
                              <Button 
                                type="submit" 
                                onClick={handleSendMessage}
                                disabled={sendingMessage || !messageText.trim()}
                              >
                                {sendingMessage ? "Отправка..." : "Отправить сообщение"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <Link href={`/talent/${resume.id}`}>
                        <Button>
                          Просмотр резюме
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* Create resume CTA for logged-in users */}
          {user && (
            <div className="mt-12 bg-primary rounded-lg p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Покажите свои навыки владельцам проектов</h2>
              <p className="mb-6 text-blue-100">
                Создайте привлекательное резюме, чтобы привлечь внимание стартапов и создателей проектов.
              </p>
              <Link href="/create-resume">
                <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-gray-100">
                  Создать резюме
                </Button>
              </Link>
            </div>
          )}
          
          {/* Create account CTA for non-logged in users */}
          {!user && (
            <div className="mt-12 bg-primary rounded-lg p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Ищете таланты для своего проекта?</h2>
              <p className="mb-6 text-blue-100">
                Создайте аккаунт, чтобы связаться со студентами и начинающими специалистами.
              </p>
              <Link href="/auth">
                <Button variant="secondary" size="lg" className="bg-white text-gray-800 hover:bg-gray-50">
                  Создать аккаунт
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
