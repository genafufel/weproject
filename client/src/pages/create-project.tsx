import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon, X } from "lucide-react";

// Define fields available for projects
const projectFields = [
  { value: "IT", label: "IT и технологии" },
  { value: "Design", label: "Искусство и дизайн" },
  { value: "Events", label: "Организация мероприятий" },
  { value: "Finance", label: "Финансы и бизнес" },
  { value: "Marketing", label: "Маркетинг и PR" },
  { value: "Education", label: "Образование и обучение" },
  { value: "Research", label: "Исследования и наука" },
  { value: "Writing", label: "Копирайтинг и контент" },
  { value: "Other", label: "Другое" },
];

export default function CreateProject() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Состояния для полей формы
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [field, setField] = useState("");
  const [positions, setPositions] = useState<string[]>(["Разработчик"]);
  const [requirements, setRequirements] = useState<string[]>(["JavaScript"]);
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Состояния для добавления новых элементов
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [isAddingRequirement, setIsAddingRequirement] = useState(false);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [newPosition, setNewPosition] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  
  // Добавление позиции
  const handleAddPosition = () => {
    if (newPosition.trim()) {
      setPositions([...positions, newPosition.trim()]);
      setNewPosition("");
      setIsAddingPosition(false);
    }
  };
  
  // Удаление позиции
  const removePosition = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index));
  };
  
  // Добавление требования
  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement("");
      setIsAddingRequirement(false);
    }
  };
  
  // Удаление требования
  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };
  
  // Добавление фото
  const handleAddPhoto = () => {
    if (newPhotoUrl.trim()) {
      try {
        // Проверка, является ли URL действительным
        new URL(newPhotoUrl);
        setPhotos([...photos, newPhotoUrl.trim()]);
        setNewPhotoUrl("");
        setIsAddingPhoto(false);
      } catch (e) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите корректный URL изображения",
          variant: "destructive",
        });
      }
    }
  };
  
  // Удаление фото
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  
  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверка обязательных полей
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
    
    // Формируем данные для отправки
    const projectData = {
      userId: user?.id,
      title,
      description,
      field,
      positions,
      requirements,
      photos,
      location,
      remote,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    
    console.log("Отправляю данные проекта через прямой fetch:", projectData);
    
    // Используем прямой fetch запрос с явными credentials: "include"
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Важно: включить cookies
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка HTTP при создании проекта:", response.status, errorText);
        throw new Error(`Ошибка создания проекта: ${response.status} ${errorText}`);
      }
      
      const project = await response.json();
      console.log("Проект успешно создан:", project);
      
      // Обновляем кеш запросов
      queryClient.invalidateQueries({ queryKey: [`/api/projects?userId=${user?.id}`] });
      
      // Показываем сообщение об успехе
      toast({
        title: "Проект успешно создан",
        description: "Ваш проект создан и теперь доступен для соискателей.",
      });
      
      // Перенаправляем на страницу с проектами
      navigate("/projects");
      
    } catch (error: any) {
      console.error("Ошибка при создании проекта:", error);
      toast({
        title: "Не удалось создать проект",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Создать новый проект</h1>
            <p className="mt-1 text-gray-600">
              Опубликуйте свой проект и найдите талантливых студентов, которые помогут воплотить его в жизнь.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Детали проекта</CardTitle>
              <CardDescription>
                Предоставьте информацию о вашем проекте, чтобы привлечь подходящих кандидатов.
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
                
                {/* Требуемые должности */}
                <div className="space-y-3">
                  <Label>Требуемые должности</Label>
                  <div className="mt-2 mb-4 flex flex-wrap gap-2">
                    {positions.map((position, index) => (
                      <Badge key={index} className="py-1 px-3 gap-2">
                        {position}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0"
                          onClick={() => removePosition(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    
                    {!isAddingPosition && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingPosition(true)}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Добавить должность
                      </Button>
                    )}
                  </div>
                  
                  {isAddingPosition && (
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="например, React-разработчик, UX/UI дизайнер"
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPosition();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddPosition}>
                        Добавить
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setIsAddingPosition(false)}>
                        Отмена
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Перечислите должности, которые вам нужны для этого проекта.
                  </p>
                </div>
                
                {/* Требования */}
                <div className="space-y-3">
                  <Label>Требования</Label>
                  <div className="mt-2 mb-4 flex flex-wrap gap-2">
                    {requirements.map((requirement, index) => (
                      <Badge key={index} variant="secondary" className="py-1 px-3 gap-2">
                        {requirement}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0"
                          onClick={() => removeRequirement(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    
                    {!isAddingRequirement && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingRequirement(true)}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Добавить требование
                      </Button>
                    )}
                  </div>
                  
                  {isAddingRequirement && (
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="например, знание JavaScript, навыки дизайна"
                        value={newRequirement}
                        onChange={(e) => setNewRequirement(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddRequirement();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddRequirement}>
                        Добавить
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setIsAddingRequirement(false)}>
                        Отмена
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Укажите необходимые навыки и квалификацию.
                  </p>
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
                          <X className="h-3 w-3" />
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
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Введите URL изображения (например, https://example.com/image.jpg)"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPhoto();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddPhoto}>
                        Добавить
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setIsAddingPhoto(false)}>
                        Отмена
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Добавьте фотографии, которые показывают ваш проект или связанные с ним изображения.
                  </p>
                </div>
                
                {/* Даты проекта */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="startDate">Дата начала проекта</Label>
                    <Input 
                      id="startDate"
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Оставьте пустым, если проект не имеет конкретной даты начала.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="endDate">Дата окончания проекта</Label>
                    <Input 
                      id="endDate"
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Оставьте пустым, если проект не имеет конкретной даты окончания.
                    </p>
                  </div>
                </div>
                
                {/* Расположение и удаленная работа */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="location">Расположение</Label>
                    <Input 
                      id="location"
                      placeholder="Например, Москва, Санкт-Петербург" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Где физически находится ваш проект.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="remote">Возможна удаленная работа</Label>
                      <Switch
                        id="remote"
                        checked={remote}
                        onCheckedChange={setRemote}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Включите, если участники могут работать удаленно.
                    </p>
                  </div>
                </div>
                
                {/* Кнопки */}
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Отмена
                  </Button>
                  <Button type="submit">
                    Создать проект
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}