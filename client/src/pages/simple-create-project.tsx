import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/layout/navbar";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SimpleCreateProject() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Простые состояния для полей формы
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [field, setField] = useState("");
  const [positions, setPositions] = useState<string[]>(["Developer"]);
  const [requirements, setRequirements] = useState<string[]>(["JavaScript"]);
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  
  // Добавление новой позиции
  const [newPosition, setNewPosition] = useState("");
  const handleAddPosition = () => {
    if (newPosition.trim()) {
      setPositions([...positions, newPosition.trim()]);
      setNewPosition("");
    }
  };
  
  // Добавление нового требования
  const [newRequirement, setNewRequirement] = useState("");
  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };
  
  // Поля для выбора области проекта
  const projectFields = [
    { value: "Information Technology", label: "Информационные технологии" },
    { value: "Arts", label: "Искусство" },
    { value: "Graphic Design", label: "Графический дизайн" },
    { value: "UX/UI Design", label: "UX/UI дизайн" },
    { value: "Business Administration", label: "Бизнес-администрирование" },
    { value: "Marketing", label: "Маркетинг" },
    { value: "Finance", label: "Финансы" },
    { value: "Education", label: "Образование" },
    { value: "Engineering", label: "Инженерия" },
    { value: "Computer Science", label: "Компьютерные науки" },
    { value: "Event Management", label: "Организация мероприятий" },
    { value: "Health Sciences", label: "Медицинские науки" },
    { value: "Other", label: "Другое" }
  ];
  
  // Обработка отправки формы
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Проверка обязательных полей
    if (!title || !description || !field || positions.length === 0 || requirements.length === 0) {
      toast({
        title: "Ошибка валидации",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }
    
    // Подготовка данных для отправки
    const projectData = {
      title,
      description,
      field,
      positions,
      requirements,
      location,
      remote,
    };
    
    try {
      console.log("Отправка данных проекта:", projectData);
      
      // Прямой fetch запрос с credentials: "include"
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Включаем cookies
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Ошибка HTTP при создании проекта:", response.status, errorText);
        throw new Error(`Ошибка создания проекта: ${response.status} ${errorText}`);
      }
      
      const project = await response.json();
      console.log("Проект успешно создан:", project);
      
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
            <h1 className="text-3xl font-bold text-gray-900">Упрощённое создание проекта</h1>
            <p className="mt-1 text-gray-600">
              Используйте эту форму для быстрого создания проекта без сложностей.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Детали проекта</CardTitle>
              <CardDescription>
                Заполните основную информацию о вашем проекте.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Название проекта *</Label>
                  <Input 
                    id="title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Введите название проекта"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="field">Область проекта *</Label>
                  <Select value={field} onValueChange={setField} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите область проекта" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectFields.map((projectField) => (
                        <SelectItem key={projectField.value} value={projectField.value}>
                          {projectField.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Описание проекта *</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Опишите ваш проект подробно"
                    className="min-h-32"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Требуемые должности *</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {positions.map((pos, index) => (
                      <div key={index} className="bg-blue-100 px-3 py-1 rounded-full flex items-center">
                        <span>{pos}</span>
                        <button 
                          type="button" 
                          className="ml-2 text-red-500"
                          onClick={() => setPositions(positions.filter((_, i) => i !== index))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={newPosition} 
                      onChange={(e) => setNewPosition(e.target.value)} 
                      placeholder="Например: React-разработчик"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPosition();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddPosition}>Добавить</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Требования *</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {requirements.map((req, index) => (
                      <div key={index} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                        <span>{req}</span>
                        <button 
                          type="button" 
                          className="ml-2 text-red-500"
                          onClick={() => setRequirements(requirements.filter((_, i) => i !== index))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={newRequirement} 
                      onChange={(e) => setNewRequirement(e.target.value)} 
                      placeholder="Например: знание JavaScript"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddRequirement();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddRequirement}>Добавить</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Местоположение</Label>
                  <Input 
                    id="location" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    placeholder="Например: Москва, Санкт-Петербург"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remote"
                    checked={remote}
                    onChange={(e) => setRemote(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="remote">Возможна удаленная работа</Label>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="w-full">Создать проект</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}