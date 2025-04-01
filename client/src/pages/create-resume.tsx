import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useCacheInvalidation } from "@/hooks/use-cache-invalidation";
import { insertResumeSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon, X, Loader2, Trash2, ImageIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Extend the education schema
const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

// Extend the experience schema
const experienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

// Extend the resume schema for form validation
const resumeFormSchema = insertResumeSchema.extend({
  newSkill: z.string().optional(),
  newTalent: z.string().optional(),
  about: z.string().optional(),
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  skills: z.array(z.string()),
  talents: z.array(z.string()),
  photos: z.array(z.string()),
}).omit({ userId: true });

type ResumeFormValues = z.infer<typeof resumeFormSchema>;

// Field of study directions
const studyDirections = [
  "Компьютерные науки",
  "Информационные технологии",
  "Графический дизайн",
  "UX/UI дизайн",
  "Бизнес администрирование",
  "Маркетинг",
  "Финансы",
  "Образование",
  "Инженерия",
  "Искусство",
  "Организация мероприятий",
  "Здравоохранение",
  "Другое"
];

export default function CreateResume() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { invalidateResumes } = useCacheInvalidation();
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isAddingTalent, setIsAddingTalent] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Two ways to get resume ID
  // 1. From URL path for /resumes/:id/edit route
  // 2. From query parameter for ?id=X route
  const urlParams = new URLSearchParams(window.location.search);
  const queryId = urlParams.get('id');
  
  // Check if we're on the edit path
  const isPathEditMode = location.includes("/resumes/") && location.includes("/edit");
  const pathId = isPathEditMode ? location.split("/")[2] : null;
  
  // Use either the path ID or query parameter ID
  const resumeId = pathId || queryId;
  
  console.log("Путь:", location);
  console.log("ID из пути:", pathId);
  console.log("ID из query параметра:", queryId);
  console.log("Используемый ID:", resumeId);
  
  useEffect(() => {
    console.log("Редактирование резюме с ID:", resumeId, "Путь:", location);
    if (resumeId) {
      setIsEditMode(true);
    }
  }, [resumeId, location]);
  
  // Fetch resume data if we're editing an existing one
  const { data: resumeData, isLoading: isLoadingResume } = useQuery({
    queryKey: [resumeId ? `/api/resumes/${resumeId}` : null],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!resumeId,
  });
  
  // Initialize form with default values
  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: {
      title: "",
      education: [{ 
        institution: "", 
        degree: "", 
        fieldOfStudy: "", 
        startDate: "", 
        endDate: "",
        description: ""
      }],
      experience: [],
      skills: [],
      direction: "",
      talents: [],
      photos: [],
      about: "",
      newSkill: "",
      newTalent: "",
    },
  });
  
  // Update form when resume data is loaded
  useEffect(() => {
    if (resumeData) {
      setIsEditMode(true);
      
      try {
        // Типизируем resumeData как any, чтобы избежать ошибок типизации
        const typedData = resumeData as any;
        
        // Улучшенная функция обработки данных из API
        const processArrayOrJSON = (data: any): any[] => {
          // Если данных нет, возвращаем пустой массив
          if (!data) return [];
          
          // Если это уже массив, возвращаем его
          if (Array.isArray(data)) return data;
          
          // Если это строка в формате JSON, пробуем преобразовать в массив
          if (typeof data === 'string') {
            try {
              const parsed = JSON.parse(data);
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.error('Ошибка при парсинге JSON-строки:', e);
              return [];
            }
          }
          
          // Если это пустой объект {}, возвращаем пустой массив
          if (typeof data === 'object' && Object.keys(data).length === 0) {
            console.log('Получен пустой объект, возвращаем пустой массив');
            return [];
          }
          
          // Если это объект с данными, пробуем преобразовать его в массив
          if (typeof data === 'object') {
            try {
              // Пробуем конвертировать объект в массив
              const values = Object.values(data);
              if (values.length > 0) {
                console.log('Преобразуем объект в массив:', values);
                return values;
              }
            } catch (e) {
              console.error('Ошибка при преобразовании объекта в массив:', e);
            }
          }
          
          // Для всех остальных случаев возвращаем пустой массив
          console.warn('Неизвестный формат данных, возвращаем пустой массив:', data);
          return [];
        };
        
        console.log("Полученные данные резюме:", typedData);
        
        // Обработка данных резюме используя нашу улучшенную функцию
        const educationData = processArrayOrJSON(typedData.education);
        const experienceData = processArrayOrJSON(typedData.experience);
        const skillsData = processArrayOrJSON(typedData.skills);
        const talentsData = processArrayOrJSON(typedData.talents);
        const photosData = processArrayOrJSON(typedData.photos);
        
        console.log('Обработанные поля:',
          'Образование:', educationData,
          'Опыт:', experienceData,
          'Навыки:', skillsData,
          'Таланты:', talentsData,
          'Фотографии:', photosData);
        
        // Reset form with values from loaded resume
        form.reset({
          title: typedData.title || "",
          direction: typedData.direction || "",
          about: typedData.about || "",
          education: educationData.length > 0 ? educationData : [{
            institution: "", 
            degree: "", 
            fieldOfStudy: "", 
            startDate: "", 
            endDate: "",
            description: ""
          }],
          experience: experienceData.length > 0 ? experienceData : [],
          skills: skillsData,
          talents: talentsData,
          photos: photosData,
          newSkill: "",
          newTalent: "",
        });
        
        console.log("Resume data loaded successfully:", typedData);
      } catch (error) {
        console.error("Error processing resume data:", error);
        toast({
          title: "Ошибка загрузки резюме",
          description: "Не удалось загрузить данные резюме. Пожалуйста, попробуйте снова.",
          variant: "destructive",
        });
      }
    }
  }, [resumeData, form, toast]);
  
  // Set up field arrays
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = 
    useFieldArray({ control: form.control, name: "skills" as any });
  
  const { fields: talentFields, append: appendTalent, remove: removeTalent } = 
    useFieldArray({ control: form.control, name: "talents" as any });
    
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = 
    useFieldArray({ control: form.control, name: "education" });
    
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = 
    useFieldArray({ control: form.control, name: "experience" });
    
  const { fields: photoFields, append: appendPhoto, remove: removePhoto } = 
    useFieldArray({ control: form.control, name: "photos" as any });
  
  // Add a new skill
  const handleAddSkill = () => {
    const newSkill = form.getValues("newSkill");
    if (newSkill) {
      appendSkill(newSkill as any);
      form.setValue("newSkill", "");
      setIsAddingSkill(false);
    }
  };
  
  // Add a new talent
  const handleAddTalent = () => {
    const newTalent = form.getValues("newTalent");
    if (newTalent) {
      appendTalent(newTalent as any);
      form.setValue("newTalent", "");
      setIsAddingTalent(false);
    }
  };
  
  // Handle photo upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('/api/upload/resume-photo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки фотографии');
      }
      
      const data = await response.json();
      console.log('Upload successful:', data);
      
      if (data.fileUrl) {
        appendPhoto(data.fileUrl as any);
        toast({
          title: 'Фотография загружена',
          description: 'Фотография успешно добавлена к резюме.',
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить фотографию. Пожалуйста, попробуйте еще раз.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Сбрасываем input, чтобы можно было загрузить тот же файл повторно
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Create resume mutation
  const createResumeMutation = useMutation({
    mutationFn: async (data: Omit<ResumeFormValues, "newSkill" | "newTalent">) => {
      // Add user ID to the data
      const resumeData = {
        ...data,
        userId: user!.id,
      };
      const res = await apiRequest("POST", "/api/resumes", resumeData);
      return await res.json();
    },
    onSuccess: (resume) => {
      // Используем хук для инвалидации кеша резюме
      invalidateResumes();
      toast({
        title: "Резюме успешно создано",
        description: "Ваше резюме создано и теперь доступно владельцам проектов.",
      });
      // Перенаправляем на страницу нового резюме
      navigate(`/talent/${resume.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Не удалось создать резюме",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update resume mutation
  const updateResumeMutation = useMutation({
    mutationFn: async (data: Omit<ResumeFormValues, "newSkill" | "newTalent">) => {
      // Add user ID to the data
      const updateData = {
        ...data,
        userId: user!.id,
      };
      const res = await apiRequest("PATCH", `/api/resumes/${resumeId}`, updateData);
      return await res.json();
    },
    onSuccess: (resume) => {
      // Используем хук для инвалидации кеша резюме, с указанием конкретного ID
      invalidateResumes(Number(resumeId));
      toast({
        title: "Резюме успешно обновлено",
        description: "Ваше резюме обновлено и изменения видны владельцам проектов.",
      });
      // Перенаправляем на страницу резюме после обновления
      navigate(`/talent/${resumeId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Не удалось обновить резюме",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: ResumeFormValues) => {
    // Remove the temporary fields used for adding new items
    const { newSkill, newTalent, ...resumeData } = values;
    
    // Decide whether to create a new resume or update an existing one
    if (isEditMode && resumeId) {
      updateResumeMutation.mutate(resumeData);
    } else {
      createResumeMutation.mutate(resumeData);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? "Редактирование резюме" : "Создать резюме"}
            </h1>
            <p className="mt-1 text-gray-600">
              {isEditMode 
                ? "Обновите своё резюме, чтобы отразить актуальные навыки и опыт."
                : "Создайте подробное резюме, чтобы продемонстрировать свои навыки и опыт владельцам проектов."
              }
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Детали резюме</CardTitle>
              <CardDescription>
                Предоставьте информацию о вашем образовании, навыках и опыте.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название резюме</FormLabel>
                        <FormControl>
                          <Input placeholder="Например, Full Stack разработчик, UX дизайнер и т.д." {...field} />
                        </FormControl>
                        <FormDescription>
                          Четкое название помогает владельцам проектов понять вашу специализацию.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Направление обучения/специализация</FormLabel>
                        <FormControl>
                          <Input
                            list="study-directions"
                            placeholder="Например, компьютерные науки, графический дизайн и т.д."
                            {...field}
                          />
                        </FormControl>
                        <datalist id="study-directions">
                          {studyDirections.map((direction) => (
                            <option key={direction} value={direction} />
                          ))}
                        </datalist>
                        <FormDescription>
                          Ваша основная область обучения или специализации.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="about"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>О себе</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Расскажите о себе и о проектах, в которых вы заинтересованы"
                            className="resize-y min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Опишите, в каких проектах вы хотели бы участвовать, ваши интересы и цели.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Education Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-base font-medium">Образование</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendEducation({ 
                          institution: "", 
                          degree: "", 
                          fieldOfStudy: "", 
                          startDate: "", 
                          endDate: "",
                          description: ""
                        })}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Добавить образование
                      </Button>
                    </div>
                    
                    {educationFields.map((field, index) => (
                      <Card key={field.id} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <FormLabel className="text-base font-medium">Образование #{index + 1}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEducation(index)}
                              disabled={educationFields.length === 1}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Удалить
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.institution`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Учебное заведение</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Название университета/школы" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`education.${index}.degree`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Степень/Квалификация</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Например, Бакалавр, Магистр" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`education.${index}.fieldOfStudy`}
                            render={({ field }) => (
                              <FormItem className="mb-4">
                                <FormLabel>Область обучения</FormLabel>
                                <FormControl>
                                  <Input placeholder="Например, Информатика, Экономика" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.startDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Дата начала</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Например, 09/2018" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`education.${index}.endDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Дата окончания (или ожидаемая)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Например, 06/2022 или Настоящее время" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`education.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Описание (необязательно)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Релевантные курсы, достижения и т.д."
                                    className="resize-y"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Experience Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-base font-medium">Опыт работы (необязательно)</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendExperience({ 
                          company: "", 
                          position: "", 
                          startDate: "", 
                          endDate: "",
                          description: ""
                        })}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Добавить опыт
                      </Button>
                    </div>
                    
                    {experienceFields.map((field, index) => (
                      <Card key={field.id} className="border border-gray-200">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <FormLabel className="text-base font-medium">Опыт #{index + 1}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExperience(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Удалить
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experience.${index}.company`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Компания/Организация</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Название компании" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`experience.${index}.position`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Должность</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Например, Стажер, Разработчик" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experience.${index}.startDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Дата начала</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Например, 06/2021" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`experience.${index}.endDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Дата окончания</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Например, 08/2021 или Настоящее время" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`experience.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Описание</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Опишите ваши обязанности и достижения"
                                    className="resize-y"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Skills Section */}
                  <div>
                    <FormLabel className="text-base font-medium">Навыки</FormLabel>
                    <div className="mt-2 mb-4 flex flex-wrap gap-2">
                      {skillFields.map((field, index) => {
                        // Получаем значение поля из формы
                        const value = form.getValues(`skills.${index}`);
                        return (
                          <Badge key={field.id} className="py-1 px-3 gap-2">
                            {typeof value === 'string' ? value : ''}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0"
                              onClick={() => removeSkill(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                      
                      {!isAddingSkill && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingSkill(true)}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Добавить навык
                        </Button>
                      )}
                    </div>
                    
                    {isAddingSkill && (
                      <div className="flex gap-2 mb-4">
                        <FormField
                          control={form.control}
                          name="newSkill"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Например, JavaScript, Photoshop, Управление проектами"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddSkill();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={handleAddSkill}>
                          Добавить
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingSkill(false)}>
                          Отмена
                        </Button>
                      </div>
                    )}
                    <FormDescription>
                      Перечислите ваши технические и профессиональные навыки.
                    </FormDescription>
                  </div>
                  
                  {/* Talents Section */}
                  <div>
                    <FormLabel className="text-base font-medium">Особые таланты (необязательно)</FormLabel>
                    <div className="mt-2 mb-4 flex flex-wrap gap-2">
                      {talentFields.map((field, index) => {
                        // Получаем значение поля из формы
                        const value = form.getValues(`talents.${index}`);
                        return (
                          <Badge key={field.id} variant="secondary" className="py-1 px-3 gap-2">
                            {typeof value === 'string' ? value : ''}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0"
                              onClick={() => removeTalent(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                      
                      {!isAddingTalent && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingTalent(true)}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Добавить талант
                        </Button>
                      )}
                    </div>
                    
                    {isAddingTalent && (
                      <div className="flex gap-2 mb-4">
                        <FormField
                          control={form.control}
                          name="newTalent"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Например, публичные выступления, писательство, фотография"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddTalent();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={handleAddTalent}>
                          Добавить
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsAddingTalent(false)}>
                          Отмена
                        </Button>
                      </div>
                    )}
                    <FormDescription>
                      Выделите свои особые способности, которые выделяют вас среди других.
                    </FormDescription>
                  </div>
                  
                  {/* Photos Section */}
                  <div>
                    <FormLabel className="text-base font-medium">Фотографии резюме (необязательно)</FormLabel>
                    <div className="mt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                        {photoFields.map((field, index) => {
                          // Получаем значение поля из формы
                          const value = form.getValues(`photos.${index}`);
                          return (
                            <div key={field.id} className="relative group">
                              <img 
                                src={value} 
                                alt={`Фото резюме ${index + 1}`} 
                                className="w-full h-32 object-cover rounded-md shadow-sm border border-gray-200"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removePhoto(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                        
                        <div className={`${photoFields.length === 0 ? 'col-span-full' : ''} flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer h-32`} onClick={() => fileInputRef.current?.click()}>
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 text-center">
                                {photoFields.length === 0 ? 'Добавьте фотографии работ, портфолио или навыков' : 'Добавить еще'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                      
                      <FormDescription>
                        Загрузите фотографии ваших работ, портфолио или примеры навыков, чтобы выделиться среди других кандидатов.
                      </FormDescription>
                    </div>
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
                      disabled={isEditMode ? updateResumeMutation.isPending : createResumeMutation.isPending}
                    >
                      {isEditMode ? (
                        updateResumeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Обновление...
                          </>
                        ) : "Сохранить изменения"
                      ) : (
                        createResumeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Создание...
                          </>
                        ) : "Создать резюме"
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
