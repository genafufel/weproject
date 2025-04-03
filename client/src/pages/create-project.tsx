import { useState, useRef } from "react";
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
import { DragDropFileUpload } from "@/components/ui/drag-drop-file-upload";
import { PlusIcon, X, Upload, Loader2 } from "lucide-react";

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
  const [locationPath, navigate] = useLocation();
  const { toast } = useToast();
  
  // Тип для должности с требованиями
  type Position = {
    id: string;
    title: string;
    requirements: string[];
  };

  // Состояния для полей формы
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [field, setField] = useState("");
  const [positions, setPositions] = useState<Position[]>([{
    id: Date.now().toString(),
    title: "Разработчик",
    requirements: ["JavaScript"]
  }]);
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Состояния для добавления новых элементов
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [newPosition, setNewPosition] = useState("");
  // Больше не используем URL для фотографий, но оставляем для совместимости
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  
  // Состояния для добавления требований к конкретной должности
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [newRequirement, setNewRequirement] = useState("");
  
  // Добавление позиции
  const handleAddPosition = () => {
    if (newPosition.trim()) {
      const newPos: Position = {
        id: Date.now().toString(),
        title: newPosition.trim(),
        requirements: []
      };
      setPositions([...positions, newPos]);
      setNewPosition("");
      setIsAddingPosition(false);
    }
  };
  
  // Удаление позиции
  const removePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
    if (editingPositionId === id) {
      setEditingPositionId(null);
    }
  };
  
  // Добавление требования к должности
  const handleAddRequirement = (positionId: string) => {
    if (newRequirement.trim()) {
      setPositions(positions.map(p => 
        p.id === positionId 
          ? { ...p, requirements: [...p.requirements, newRequirement.trim()] } 
          : p
      ));
      setNewRequirement("");
    }
  };
  
  // Удаление требования из должности
  const removeRequirement = (positionId: string, requirementIndex: number) => {
    setPositions(positions.map(p => 
      p.id === positionId 
        ? { ...p, requirements: p.requirements.filter((_, i) => i !== requirementIndex) } 
        : p
    ));
  };
  
  // Ссылка на скрытый input для загрузки файла
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Новый обработчик для загрузки фото через файл
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Неверный формат файла",
        description: "Пожалуйста, выберите изображение",
        variant: "destructive",
      });
      return;
    }
    
    // Проверка размера файла (максимум 5 МБ)
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
  
  // Обработчик для drag-and-drop загрузки
  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      handleFileUpload(files[0]); // Берем только один файл для загрузки
    }
  };
  
  // Обработчик изменения файла через Input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  // Оставляем пустой обработчик для совместимости
  const handleAddPhoto = () => {};
  
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
    
    // Подготавливаем данные позиций для отправки на сервер
    // В БД мы храним отдельно позиции и требования, поэтому разделяем их
    const positionTitles = positions.map(p => p.title);
    const allRequirements = positions.flatMap(p => p.requirements);
  
    // Формируем данные для отправки
    const projectData = {
      userId: user?.id,
      title,
      description,
      field,
      positions: positionTitles,
      requirements: allRequirements,
      photos,
      location,
      remote,
      startDate: startDate ? startDate : undefined,  // Оставляем как строку в формате YYYY-MM-DD
      endDate: endDate ? endDate : undefined,        // Оставляем как строку в формате YYYY-MM-DD
      positionsWithRequirements: positions // Добавляем оригинальную структуру для будущего использования
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
      
      // Перенаправляем на страницу созданного проекта
      navigate(`/projects/${project.id}`);
      
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
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Создать новый проект</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
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
                    className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500"
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
                    <SelectTrigger className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                      <SelectValue placeholder="Выберите область вашего проекта" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
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
                    className="min-h-32 resize-y dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500"
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
                    <div key={position.id} className="rounded-md border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-white dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg text-gray-900 dark:text-gray-100">{position.title}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePosition(position.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
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
                                <X className="h-3 w-3" />
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
                              className="flex-1 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500"
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
                    <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-white dark:bg-gray-800">
                      <Label>Новая должность</Label>
                      <div className="flex gap-2">
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
                          className="flex-1 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500"
                        />
                        <Button type="button" onClick={handleAddPosition}>
                          Добавить
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingPosition(false)}>
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
                    <div className="flex flex-col gap-4 mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                      <div>
                        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Загрузить фото проекта</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Выберите изображение с вашего устройства или перетащите его сюда
                        </p>
                        
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        
                        <DragDropFileUpload
                          onFilesSelected={handleFilesSelected}
                          accept="image/*"
                          disabled={uploadingPhoto}
                          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-6 mb-4 flex flex-col items-center justify-center hover:border-primary transition-colors"
                        >
                          <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {uploadingPhoto ? "Загрузка..." : "Перетащите изображение сюда"}
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              или выберите файл с компьютера (PNG, JPG, GIF до 5 МБ)
                            </p>
                          </div>
                        </DragDropFileUpload>
                        
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                          >
                            {uploadingPhoto ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Загрузка...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Выбрать файл
                              </>
                            )}
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => setIsAddingPhoto(false)}>
                            Отмена
                          </Button>
                        </div>
                      </div>
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
                      className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
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
                      className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
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
                      className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500"
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
                    onClick={() => navigate("/projects")}
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