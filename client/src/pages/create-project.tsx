import { useState, useId } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { insertProjectSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { PlusIcon, X, Loader2 } from "lucide-react";

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

// Определяем тип для полей с массивами, который может быть как обычным массивом, так и массивом объектов react-hook-form
type FieldArrayType = string[] | { id: string; value: string }[];

// Extend the project schema for form validation
const projectFormSchema = insertProjectSchema.extend({
  positions: z.any(), // Используем any для FieldArray из react-hook-form
  requirements: z.any(), // Используем any для FieldArray из react-hook-form
  photos: z.any().optional(), // Используем any для FieldArray из react-hook-form
  newPosition: z.string().optional(),
  newRequirement: z.string().optional(),
  newPhotoUrl: z.string().url("Пожалуйста, введите корректный URL изображения").optional(),
}).omit({ userId: true });

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function CreateProject() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [isAddingRequirement, setIsAddingRequirement] = useState(false);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  
  // Initialize form with default values
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      field: "",
      positions: [],
      requirements: [],
      location: "",
      remote: false,
      photos: [],
      startDate: undefined,
      endDate: undefined,
      newPosition: "",
      newRequirement: "",
      newPhotoUrl: "",
    },
  });
  
  // Set up field arrays for positions, requirements, and photos
  const { fields: positionFields, append: appendPosition, remove: removePosition } = 
    useFieldArray({ control: form.control, name: "positions" as any });
  
  const { fields: requirementFields, append: appendRequirement, remove: removeRequirement } = 
    useFieldArray({ control: form.control, name: "requirements" as any });
    
  const { fields: photoFields, append: appendPhoto, remove: removePhoto } = 
    useFieldArray({ control: form.control, name: "photos" as any });
  
  // Add a new position
  const handleAddPosition = () => {
    const newPosition = form.getValues("newPosition");
    if (newPosition) {
      // Добавляем новый элемент и проверяем, что он добавился
      appendPosition({ id: `pos-${Date.now()}`, value: newPosition } as any);
      console.log("Добавлена должность:", newPosition);
      console.log("Текущие должности:", [...positionFields, { id: `pos-${Date.now()}`, value: newPosition }]);
      
      form.setValue("newPosition", "");
      setIsAddingPosition(false);
    }
  };
  
  // Add a new requirement
  const handleAddRequirement = () => {
    const newRequirement = form.getValues("newRequirement");
    if (newRequirement) {
      // Добавляем новый элемент и проверяем, что он добавился
      appendRequirement({ id: `req-${Date.now()}`, value: newRequirement } as any);
      console.log("Добавлено требование:", newRequirement);
      console.log("Текущие требования:", [...requirementFields, { id: `req-${Date.now()}`, value: newRequirement }]);
      
      form.setValue("newRequirement", "");
      setIsAddingRequirement(false);
    }
  };
  
  // Add a new photo URL
  const handleAddPhoto = () => {
    const newPhotoUrl = form.getValues("newPhotoUrl");
    if (newPhotoUrl) {
      // Добавляем новый элемент и проверяем, что он добавился
      appendPhoto({ id: `photo-${Date.now()}`, value: newPhotoUrl } as any);
      console.log("Добавлено фото:", newPhotoUrl);
      console.log("Текущие фото:", [...photoFields, { id: `photo-${Date.now()}`, value: newPhotoUrl }]);
      
      form.setValue("newPhotoUrl", "");
      setIsAddingPhoto(false);
    }
  };
  
  // Запрос для проверки состояния аутентификации через endpoint
  const { data: authCheckData, isLoading: isAuthCheckLoading } = useQuery({
    queryKey: ['/api/auth-check'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth-check');
        if (!res.ok) {
          if (res.status === 401) {
            console.warn("Пользователь не аутентифицирован");
            return null;
          }
          throw new Error(`Ошибка проверки аутентификации: ${res.status}`);
        }
        const data = await res.json();
        console.log("Успешная проверка аутентификации:", data);
        return data;
      } catch (err) {
        console.error("Ошибка проверки аутентификации:", err);
        return null;
      }
    },
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: Omit<ProjectFormValues, "newPosition" | "newRequirement" | "newPhotoUrl">) => {
      // Сначала проверим состояние аутентификации
      console.log("Auth check before submitting project:", authCheckData);
      
      const res = await apiRequest("POST", "/api/projects", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects?userId=${user?.id}`] });
      toast({
        title: "Проект успешно создан",
        description: "Ваш проект создан и теперь доступен для соискателей.",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Не удалось создать проект",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: ProjectFormValues) => {
    // Remove the temporary fields used for adding new items
    const { newPosition, newRequirement, newPhotoUrl, ...projectData } = values;
    
    // Преобразуем поля, которые должны быть массивами
    const formattedData = {
      ...projectData,
      // Преобразуем поля в простые массивы строк
      positions: positionFields.map((field: any) => 
        typeof field === 'string' ? field : field.value || ''),
      requirements: requirementFields.map((field: any) => 
        typeof field === 'string' ? field : field.value || ''),
      photos: photoFields.map((field: any) => 
        typeof field === 'string' ? field : field.value || '')
    };
    
    console.log("Отправляю данные проекта через прямой fetch:", formattedData);
    
    // Используем прямой fetch запрос с явными credentials: "include"
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Важно: включить cookies
        body: JSON.stringify(formattedData),
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название проекта</FormLabel>
                        <FormControl>
                          <Input placeholder="Введите четкое, описательное название" {...field} />
                        </FormControl>
                        <FormDescription>
                          Сделайте название конкретным и привлекающим внимание.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="field"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Область проекта</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите область вашего проекта" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectFields.map((projectField) => (
                              <SelectItem key={projectField.value} value={projectField.value}>
                                {projectField.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Выберите область, которая лучше всего представляет ваш проект.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание проекта</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Опишите ваш проект подробно"
                            className="min-h-32 resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Включите цели проекта, сроки и то, чего вы хотите достичь.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel>Требуемые должности</FormLabel>
                    <div className="mt-2 mb-4 flex flex-wrap gap-2">
                      {positionFields.map((field: any, index) => (
                        <Badge key={field.id} className="py-1 px-3 gap-2">
                          {typeof field === 'string' ? field : field.value || ''}
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
                        <FormField
                          control={form.control}
                          name="newPosition"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="например, React-разработчик, UX/UI дизайнер"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddPosition();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={handleAddPosition}>
                          Добавить
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingPosition(false)}>
                          Отмена
                        </Button>
                      </div>
                    )}
                    <FormDescription>
                      Перечислите должности, которые вам нужны для этого проекта.
                    </FormDescription>
                  </div>
                  
                  <div>
                    <FormLabel>Требования</FormLabel>
                    <div className="mt-2 mb-4 flex flex-wrap gap-2">
                      {requirementFields.map((field: any, index) => (
                        <Badge key={field.id} variant="secondary" className="py-1 px-3 gap-2">
                          {typeof field === 'string' ? field : field.value || ''}
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
                        <FormField
                          control={form.control}
                          name="newRequirement"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="например, знание JavaScript, навыки дизайна"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddRequirement();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={handleAddRequirement}>
                          Добавить
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingRequirement(false)}>
                          Отмена
                        </Button>
                      </div>
                    )}
                    <FormDescription>
                      Укажите необходимые навыки и квалификацию.
                    </FormDescription>
                  </div>
                  
                  <div>
                    <FormLabel>Фотографии проекта</FormLabel>
                    <div className="mt-2 mb-4 flex flex-wrap gap-2">
                      {photoFields.map((field: any, index) => (
                        <div key={field.id} className="relative group">
                          <img 
                            src={typeof field === 'string' ? field : field.value || ''}
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
                        <FormField
                          control={form.control}
                          name="newPhotoUrl"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Введите URL изображения (например, https://example.com/image.jpg)"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddPhoto();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={handleAddPhoto}>
                          Добавить
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingPhoto(false)}>
                          Отмена
                        </Button>
                      </div>
                    )}
                    <FormDescription>
                      Добавьте фотографии, которые показывают ваш проект или связанные с ним изображения.
                    </FormDescription>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата начала проекта</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                field.onChange(date);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Оставьте пустым, если проект не имеет конкретной даты начала.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата окончания проекта</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                              onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                field.onChange(date);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Оставьте пустым, если проект не имеет конкретной даты окончания.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Расположение</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="например, Москва, Санкт-Петербург" 
                              value={field.value || ''} 
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormDescription>
                            Оставьте пустым, если расположение гибкое.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="remote"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Удаленная работа</FormLabel>
                            <FormDescription>
                              Открыт ли этот проект для удаленного сотрудничества?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      disabled={createProjectMutation.isPending}
                    >
                      {createProjectMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Создание...
                        </>
                      ) : (
                        "Создать проект"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
