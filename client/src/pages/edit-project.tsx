import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Определение типа для проекта
interface ProjectPosition {
  id: string;
  title: string;
  description: string;
  requirements: string[];
}

interface Project {
  id: number;
  userId: number;
  title: string;
  description: string;
  field: string;
  positions: string[];
  requirements: string[];
  location: string | null;
  remote: boolean;
  photos: string[] | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  positionsWithRequirements?: ProjectPosition[];
}
import { Calendar as CalendarIcon, X as XIcon, Plus as PlusIcon, Loader2 } from "lucide-react";

// Определяем поля проектов для использования в форме
const projectFields = [
  { value: "IT", label: "Информационные технологии" },
  { value: "Design", label: "Дизайн" },
  { value: "Marketing", label: "Маркетинг" },
  { value: "Business", label: "Бизнес" },
  { value: "Education", label: "Образование" },
  { value: "Art", label: "Искусство" },
  { value: "Science", label: "Наука" },
  { value: "Engineering", label: "Инженерия" },
  { value: "Finance", label: "Финансы" },
  { value: "Healthcare", label: "Здравоохранение" },
  { value: "Media", label: "Медиа" },
  { value: "Legal", label: "Юриспруденция" },
  { value: "Social", label: "Социальная сфера" },
  { value: "Entertainment", label: "Развлечения" },
  { value: "Sports", label: "Спорт" },
  { value: "Other", label: "Другое" }
];

export default function EditProject() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Extract project ID from URL (/projects/:id/edit)
  const projectId = parseInt(location.split("/")[2]);
  
  // Fetch project data
  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
  });
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [field, setField] = useState<string>("");
  const [positions, setPositions] = useState<ProjectPosition[]>([]);
  const [newPosition, setNewPosition] = useState("");
  const [newPositionDescription, setNewPositionDescription] = useState("");
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [newRequirement, setNewRequirement] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [location_, setLocation_] = useState("");
  const [remote, setRemote] = useState(false);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Populate form with project data when available
  useEffect(() => {
    if (project) {
      setTitle(project.title || "");
      setDescription(project.description || "");
      setField(project.field || "");
      setLocation_(project.location || "");
      setRemote(project.remote || false);
      setStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : undefined);
      setEndDate(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : undefined);
      setPhotos(project.photos || []);
      
      // Handle positions and requirements
      if (project.positionsWithRequirements && project.positionsWithRequirements.length > 0) {
        setPositions(project.positionsWithRequirements.map((pos: any, index: number) => ({
          id: String(index),
          title: pos.title,
          description: pos.description || "Без описания",
          requirements: pos.requirements || []
        })));
      } else if (project.positions) {
        // Backward compatibility for old project structure
        setPositions(project.positions.map((pos: string, index: number) => ({
          id: String(index),
          title: pos,
          description: "Без описания",
          requirements: []
        })));
      }
    }
  }, [project]);
  
  // Generate a unique ID for new positions
  const generateId = () => {
    return Date.now().toString();
  };
  
  // Add a new position
  const handleAddPosition = () => {
    if (newPosition.trim()) {
      const newPos: ProjectPosition = {
        id: generateId(),
        title: newPosition.trim(),
        description: newPositionDescription.trim() || "Без описания",
        requirements: []
      };
      setPositions([...positions, newPos]);
      setNewPosition("");
      setNewPositionDescription("");
      setIsAddingPosition(false);
    }
  };
  
  // Remove a position
  const removePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
    if (editingPositionId === id) {
      setEditingPositionId(null);
    }
  };
  
  // Add a requirement to a position
  const handleAddRequirement = (positionId: string) => {
    if (newRequirement.trim()) {
      const updatedPositions = positions.map(p => {
        if (p.id === positionId) {
          return {
            ...p,
            requirements: [...p.requirements, newRequirement.trim()]
          };
        }
        return p;
      });
      setPositions(updatedPositions);
      setNewRequirement("");
    }
  };
  
  // Remove a requirement from a position
  const removeRequirement = (positionId: string, requirementIndex: number) => {
    const updatedPositions = positions.map(p => {
      if (p.id === positionId) {
        const updatedRequirements = [...p.requirements];
        updatedRequirements.splice(requirementIndex, 1);
        return {
          ...p,
          requirements: updatedRequirements
        };
      }
      return p;
    });
    setPositions(updatedPositions);
  };
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Неверный формат файла",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер файла - 5 МБ",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUploadingPhoto(true);
      console.log("Начинаем загрузку файла:", file.name, file.type, file.size);
      
      const formData = new FormData();
      formData.append('photo', file);
      
      console.log("Отправляем запрос на сервер...");
      const response = await fetch('/api/upload/project-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка HTTP при загрузке фото:", response.status, errorText);
        throw new Error(`Ошибка HTTP: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Ответ сервера:", data);
      setPhotos([...photos, data.fileUrl]);
      
      toast({
        title: "Фото загружено",
        description: "Фото проекта успешно загружено",
      });
    } catch (error: any) {
      console.error("Ошибка загрузки фото:", error);
      toast({
        title: "Ошибка загрузки фото",
        description: error.message || "Неизвестная ошибка при загрузке файла",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
      setIsAddingPhoto(false);
    }
  };
  
  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  // Remove a photo
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  
  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const res = await apiRequest("PUT", `/api/projects/${projectId}`, projectData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      toast({
        title: "Проект обновлен",
        description: "Ваш проект был успешно обновлен.",
      });
      
      // Navigate back to project detail page
      navigate(`/projects/${projectId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка обновления проекта",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!title.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, укажите название проекта",
        variant: "destructive",
      });
      return;
    }
    
    if (!field) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите область проекта",
        variant: "destructive",
      });
      return;
    }
    
    if (!description.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, добавьте описание проекта",
        variant: "destructive",
      });
      return;
    }
    
    // Подготовка данных позиций для сервера в безопасном формате
    const positionTitles = positions.map(p => p.title);
    const allRequirements = positions.flatMap(p => p.requirements);
    
    // Необходимо глубоко клонировать объекты позиций для отправки на сервер
    // чтобы избежать циклических ссылок при JSON.stringify
    const positionsWithRequirementsCopy = positions.map(pos => ({
      id: pos.id,
      title: pos.title,
      description: pos.description,
      requirements: [...pos.requirements]
    }));
    
    // Prepare project data
    const projectData = {
      title,
      description,
      field,
      positions: positionTitles,
      requirements: allRequirements,
      photos,
      location: location_,
      remote,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      positionsWithRequirements: positionsWithRequirementsCopy
    };
    
    console.log("Отправляю обновленные данные проекта:", projectData);
    updateMutation.mutate(projectData);
  };
  
  // Loading state
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
  
  // Error state
  if (error || !project) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Проект не найден</h1>
            <p className="text-gray-600 mb-8">Проект, который вы пытаетесь редактировать, не существует или был удален.</p>
            <Button asChild>
              <Link href="/projects">Просмотреть все проекты</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Check if user is owner
  if (user?.id !== project.userId) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Доступ запрещен</h1>
            <p className="text-gray-600 mb-8">У вас нет прав для редактирования этого проекта.</p>
            <Button asChild>
              <Link href={`/projects/${projectId}`}>Вернуться к проекту</Link>
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
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Редактировать проект</h1>
            <p className="mt-1 text-gray-600">
              Обновите информацию о вашем проекте, чтобы привлечь подходящих кандидатов.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Детали проекта</CardTitle>
              <CardDescription>
                Внесите необходимые изменения в информацию о вашем проекте.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Название проекта */}
                <div className="space-y-3">
                  <Label htmlFor="title">Название проекта</Label>
                  <Input 
                    id="title"
                    placeholder="Введите четкое, описательное название" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Сделайте название конкретным и привлекающим внимание.
                  </p>
                </div>
                
                {/* Область проекта */}
                <div className="space-y-3">
                  <Label htmlFor="field">Область проекта</Label>
                  <Select 
                    value={field} 
                    onValueChange={setField}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите область вашего проекта" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectFields.map((projectField) => (
                        <SelectItem key={projectField.value} value={projectField.value}>
                          {projectField.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Выберите область, которая лучше всего представляет ваш проект.
                  </p>
                </div>
                
                {/* Описание проекта */}
                <div className="space-y-3">
                  <Label htmlFor="description">Описание проекта</Label>
                  <Textarea
                    id="description"
                    placeholder="Опишите ваш проект подробно"
                    className="min-h-32 resize-y"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Включите цели проекта, сроки и то, чего вы хотите достичь.
                  </p>
                </div>
                
                {/* Должности и требования */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Должности и требования</Label>
                    <p className="text-sm text-muted-foreground">
                      Добавьте должности, которые требуются для вашего проекта, и укажите требования к каждой из них.
                    </p>
                  </div>
                  
                  {positions.map((position) => (
                    <div key={position.id} className="rounded-md border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg">{position.title}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePosition(position.id)}
                          className="h-8 w-8 p-0"
                        >
                          <XIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p className="font-medium mb-1">Описание должности:</p>
                        <p>{position.description}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <Label>Требования для должности "{position.title}"</Label>
                        <div className="flex flex-wrap gap-2">
                          {position.requirements.map((req, reqIndex) => (
                            <Badge key={reqIndex} variant="secondary" className="py-1 px-3 gap-2">
                              {req}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                                onClick={() => removeRequirement(position.id, reqIndex)}
                              >
                                <XIcon className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        
                        {editingPositionId === position.id ? (
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="например, знание JavaScript, опыт работы с UI/UX"
                              value={newRequirement}
                              onChange={(e) => setNewRequirement(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddRequirement(position.id);
                                }
                              }}
                              className="flex-1"
                            />
                            <Button type="button" onClick={() => handleAddRequirement(position.id)}>
                              Добавить
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setEditingPositionId(null)}>
                              Отмена
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPositionId(position.id)}
                            className="mt-2"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Добавить требование
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {!isAddingPosition ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingPosition(true)}
                      className="w-full"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Добавить новую должность
                    </Button>
                  ) : (
                    <div className="rounded-md border p-4 space-y-3">
                      <Label>Новая должность</Label>
                      <Input
                        placeholder="например, React-разработчик, UX/UI дизайнер"
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        className="mb-3"
                      />
                      <Label>Описание должности</Label>
                      <Textarea
                        placeholder="Опишите обязанности, которые будет выполнять специалист"
                        value={newPositionDescription}
                        onChange={(e) => setNewPositionDescription(e.target.value)}
                        className="min-h-24 resize-y mb-3"
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={handleAddPosition} className="flex-1">
                          Добавить
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => {
                          setIsAddingPosition(false);
                          setNewPosition("");
                          setNewPositionDescription("");
                        }}>
                          Отмена
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Фотографии проекта */}
                <div className="space-y-3">
                  <Label>Фотографии проекта</Label>
                  <div className="mt-2 mb-4 flex flex-wrap gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={photo}
                          alt="Фото проекта" 
                          className="h-24 w-32 object-cover rounded-md" 
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {!isAddingPhoto && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-24 w-32"
                        onClick={() => setIsAddingPhoto(true)}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Добавить фото
                      </Button>
                    )}
                  </div>
                  
                  {isAddingPhoto && (
                    <div className="flex flex-col gap-4 mb-4 p-4 border rounded-md">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Загрузить фото проекта</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Выберите файл изображения с вашего компьютера (макс. 5 МБ).
                        </p>
                        
                        <div className="flex gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="flex-1"
                          >
                            {uploadingPhoto ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Загрузка...
                              </>
                            ) : (
                              'Выбрать файл'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsAddingPhoto(false)}
                            disabled={uploadingPhoto}
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Локация и формат работы */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="location">Место проведения (опционально)</Label>
                    <Input 
                      id="location"
                      placeholder="Например, Москва, ул. Пушкина 10" 
                      value={location_}
                      onChange={(e) => setLocation_(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="remote">Формат работы</Label>
                    <Select 
                      value={remote ? "true" : "false"} 
                      onValueChange={(value) => setRemote(value === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите формат работы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Очно</SelectItem>
                        <SelectItem value="true">Удаленно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Даты проекта */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="startDate">Дата начала (опционально)</Label>
                    <Input 
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="endDate">Дата окончания (опционально)</Label>
                    <Input 
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Кнопки действий */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/projects/${projectId}`)}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      'Сохранить изменения'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}