import { useState, useMemo, FormEvent, ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin, ChevronDown } from "lucide-react";
import { CardContainer } from "@/components/card-container";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Project fields for filtering
const projectFields = [
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
  { value: "Writing", label: "Копирайтинг и контент" },
  { value: "Other", label: "Другое" },
];

export default function Projects() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Parse URL parameters
  const params = new URLSearchParams(location.split("?")[1] || "");
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState(params.get("search") || "");
  const [selectedField, setSelectedField] = useState(params.get("field") || "all");
  const [remoteOnly, setRemoteOnly] = useState(params.get("remote") === "true");
  const [dateFrom, setDateFrom] = useState<string>(params.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState<string>(params.get("dateTo") || "");
  
  // Build query string for API
  const buildQueryString = () => {
    const queryParams = new URLSearchParams();
    
    if (searchTerm) queryParams.append("search", searchTerm);
    if (selectedField && selectedField !== "all") queryParams.append("field", selectedField);
    if (remoteOnly) queryParams.append("remote", "true");
    if (dateFrom) queryParams.append("dateFrom", dateFrom);
    if (dateTo) queryParams.append("dateTo", dateTo);
    
    return queryParams.toString();
  };
  
  // Update URL with filters
  const updateUrlWithFilters = () => {
    const queryString = buildQueryString();
    setLocation(queryString ? `/projects?${queryString}` : "/projects", { replace: true });
  };
  
  // Fetch projects based on filters
  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery<any[]>({
    queryKey: [`/api/projects?${buildQueryString()}`],
  });
  
  // Получаем список уникальных userId из проектов
  const userIds = useMemo(() => {
    if (!projects || !projects.length) return [];
    return Array.from(new Set(projects.map(project => project.userId)));
  }, [projects]);
  
  // Получаем информацию о пользователях
  const userQueries = useQuery({
    queryKey: ['/api/users/batch'],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const users: Record<number, any> = {};
      await Promise.all(userIds.map(async (userId) => {
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            users[userId] = userData;
          }
        } catch (err) {
          console.error(`Error fetching user ${userId}:`, err);
        }
      }));
      return users;
    }
  });
  
  // Handle search submit
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateUrlWithFilters();
  };
  
  // Handle field change
  const handleFieldChange = (value: string) => {
    setSelectedField(value);
    setTimeout(updateUrlWithFilters, 0);
  };
  
  // Handle remote toggle
  const handleRemoteToggle = (checked: boolean) => {
    setRemoteOnly(checked);
    setTimeout(updateUrlWithFilters, 0);
  };
  
  // Handle date change
  const handleDateFromChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDateFrom(e.target.value);
    setTimeout(updateUrlWithFilters, 0);
  };
  
  const handleDateToChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDateTo(e.target.value);
    setTimeout(updateUrlWithFilters, 0);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedField("all");
    setRemoteOnly(false);
    setDateFrom("");
    setDateTo("");
    setLocation("/projects", { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Hero section */}
        <div className="relative bg-gradient-to-br from-primary to-blue-600 text-white py-16 overflow-hidden">
          {/* Декоративные элементы */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-blue-400 filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-indigo-500 filter blur-3xl"></div>
            <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-purple-500 filter blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl font-extrabold mb-4 animate-fade-in">Поиск проектов</h1>
              <p className="text-blue-100 text-lg mb-8 animate-fade-in animate-delay-100">
                Найдите интересные возможности в различных областях для формирования вашего портфолио и развития карьеры.
              </p>
              
              {/* Search form */}
              <form onSubmit={handleSearchSubmit} className="flex w-full gap-2 animate-fade-in animate-delay-200">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Поиск проектов по названию или ключевым словам"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white/90 backdrop-blur-sm text-gray-900 border-0 shadow-lg focus:bg-white"
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="secondary" 
                  className="bg-white/90 backdrop-blur-sm text-primary hover:bg-white shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Поиск
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Filters section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Фильтры:</span>
                
                <Select value={selectedField} onValueChange={handleFieldChange}>
                  <SelectTrigger className="w-[180px] shadow-sm border border-gray-200 hover:border-primary/30 transition-all">
                    <SelectValue placeholder="Направление" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectFields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-md shadow-sm">
                  <Switch
                    id="remote-only"
                    checked={remoteOnly}
                    onCheckedChange={handleRemoteToggle}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="remote-only" className="cursor-pointer">Только удаленно</Label>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-md shadow-sm">
                  <Label htmlFor="date-from" className="whitespace-nowrap text-xs">Начало:</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={handleDateFromChange}
                    className="w-auto border-gray-200"
                  />
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-md shadow-sm">
                  <Label htmlFor="date-to" className="whitespace-nowrap text-xs">Окончание:</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={handleDateToChange}
                    className="w-auto border-gray-200"
                  />
                </div>
                
                {(searchTerm || selectedField !== "all" || remoteOnly || dateFrom || dateTo) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="text-gray-500 hover:text-primary"
                  >
                    Сбросить фильтры
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-md shadow-sm">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Загрузка...
                    </span>
                  ) : (
                    <span className="font-medium">{projects?.length || 0} результатов</span>
                  )}
                </span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 border-gray-200 shadow-sm hover:border-primary/50"
                    >
                      Сортировка
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="shadow-lg">
                    <DropdownMenuLabel>Сортировка</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked>
                      Сначала новые
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      Сначала старые
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
        
        {/* Projects list */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Не удалось загрузить проекты. Пожалуйста, попробуйте позже.</p>
            </div>
          ) : !projects?.length ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Проекты не найдены</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Мы не смогли найти проекты, соответствующие вашим критериям поиска.
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Очистить все фильтры
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {projects.map((project: any) => (
                <Card 
                  key={project.id} 
                  className="overflow-hidden hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 flex flex-col h-full group"
                >
                  {project.photos && project.photos.length > 0 ? (
                    <Link href={`/projects/${project.id}`}>
                      <div className="relative h-48 w-full overflow-hidden">
                        <img 
                          src={project.photos[0].startsWith('/uploads') ? project.photos[0] : `/uploads/${project.photos[0].split('/').pop()}`}
                          alt={project.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = '/uploads/default.jpg';
                            e.stopPropagation();
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </Link>
                  ) : (
                    <div className="h-24 bg-gradient-to-r from-primary/10 to-blue-400/10 flex items-center justify-center">
                      <span className="text-primary/40 text-lg font-medium">Нет изображения</span>
                    </div>
                  )}
                  
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-xl">
                          <Link href={`/projects/${project.id}`} className="hover:text-primary transition-colors">
                            {project.title}
                          </Link>
                        </CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Опубликовано: <span className="text-primary">
                            {userQueries.data && userQueries.data[project.userId]
                              ? userQueries.data[project.userId].name || userQueries.data[project.userId].username
                              : "Загрузка..."}
                          </span>
                        </p>
                      </div>
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                        {(() => {
                          if (typeof project.field === 'object' && project.field !== null) {
                            return project.field?.label || project.field?.title || '';
                          } else {
                            const fieldItem = projectFields.find(f => f.value === project.field);
                            return fieldItem ? fieldItem.label : project.field;
                          }
                        })()}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2 flex-grow">
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{project.description}</p>
                    
                    {(project.positions && project.positions.length > 0) && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">Требуемые позиции:</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(project.positions || []).map((position: any, index: number) => (
                            <Badge 
                              key={index} 
                              className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                            >
                              {typeof position === 'string' ? position : position.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex flex-col pt-0 mt-auto border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center w-full pt-3">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                          <span>{project.remote ? "Удаленно" : project.location || "Местоположение не указано"}</span>
                        </div>
                        {(project.startDate || project.endDate) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {project.startDate && new Date(project.startDate).toLocaleDateString('ru-RU')}
                            {project.startDate && project.endDate && " - "}
                            {project.endDate && new Date(project.endDate).toLocaleDateString('ru-RU')}
                          </div>
                        )}
                      </div>
                      
                      <Link href={`/projects/${project.id}`}>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                        >
                          Подробнее
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Post a project CTA for non-applicants */}
          {user?.userType === "projectOwner" && (
            <div className="mt-12 relative bg-gradient-to-r from-primary to-blue-600 rounded-lg p-8 text-white text-center overflow-hidden shadow-lg">
              {/* Декоративные элементы */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-1/4 w-40 h-40 rounded-full bg-white"></div>
                <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-blue-300"></div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-extrabold mb-2">Нужны таланты для ваших проектов?</h2>
                <p className="mb-6 text-blue-100">
                  Разместите новый проект, чтобы связаться с талантливыми студентами и начинающими специалистами.
                </p>
                <Link href="/create-project">
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="bg-white/90 backdrop-blur-sm text-primary hover:bg-white shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    Разместить проект
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          {/* Create account CTA for non-logged in users */}
          {!user && (
            <div className="mt-12 relative bg-gradient-to-r from-primary to-blue-600 rounded-lg p-8 text-white text-center overflow-hidden shadow-lg">
              {/* Декоративные элементы */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-1/4 w-40 h-40 rounded-full bg-white"></div>
                <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-blue-300"></div>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-extrabold mb-2">Готовы откликнуться на проекты?</h2>
                <p className="mb-6 text-blue-100">
                  Создайте аккаунт, чтобы откликаться на проекты и создавать своё портфолио.
                </p>
                <Link href="/auth">
                  <Button 
                    variant="secondary" 
                    size="lg"
                    className="bg-white/90 backdrop-blur-sm text-primary hover:bg-white shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    Создать аккаунт
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
