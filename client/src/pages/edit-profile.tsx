import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, User, Check, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Создаем схему валидации для формы редактирования профиля
const profileSchema = z.object({
  fullName: z.string().min(2, { message: "ФИО должно содержать не менее 2 символов" }),
  email: z.string().email({ message: "Введите корректный email" }),
  phone: z.string().min(10, { message: "Номер телефона должен содержать не менее 10 цифр" }),
});

// Создаем схему валидации для формы изменения пароля
const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Текущий пароль обязателен" }),
  newPassword: z.string().min(8, { message: "Новый пароль должен содержать не менее 8 символов" }),
  confirmPassword: z.string().min(1, { message: "Подтверждение пароля обязательно" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function EditProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Если пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!user) {
    navigate("/auth");
    return null;
  }
  
  // Создаем форму с использованием react-hook-form и zod для валидации
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
    },
  });
  
  // Создаем форму для изменения пароля
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Мутация для обновления профиля пользователя
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/user/${user.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Профиль обновлен",
        description: "Ваш профиль был успешно обновлен.",
      });
      
      // Просто инвалидируем кэш пользователя и перенаправляем пользователя
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка обновления профиля",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Мутация для изменения пароля
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("POST", `/api/user/${user.id}/change-password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Пароль изменен",
        description: "Ваш пароль был успешно изменен.",
      });
      
      // Сбрасываем форму
      passwordForm.reset();
      
      // Переходим на вкладку профиля
      setActiveTab("profile");
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка изменения пароля",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Обработчик загрузки аватара
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('userId', user.id.toString());
      
      const response = await fetch(`/api/upload/avatar?userId=${user.id}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка загрузки изображения');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // Устанавливаем превью аватара
      setAvatarPreview(data.fileUrl);
      
      toast({
        title: "Фото загружено",
        description: "Ваше фото профиля успешно загружено.",
      });
      
      // Обновляем кэш пользователя
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      setUploadingAvatar(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка загрузки фото",
        description: error.message,
        variant: "destructive",
      });
      setUploadingAvatar(false);
    }
  });
  
  // Обработчик изменения файла
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    
    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Загружаем файл
    setUploadingAvatar(true);
    uploadAvatarMutation.mutate(file);
  };
  
  // Обработчик отправки формы
  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  // Обработчик отправки формы изменения пароля
  const onPasswordSubmit = (values: PasswordFormValues) => {
    changePasswordMutation.mutate(values);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Настройки аккаунта</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Обновите свою информацию и настройте безопасность аккаунта.
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="profile" className="dark:data-[state=active]:bg-gray-800">Профиль</TabsTrigger>
              <TabsTrigger value="password" className="dark:data-[state=active]:bg-gray-800">Безопасность</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">Информация профиля</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Эта информация будет отображаться в вашем публичном профиле
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Секция загрузки фото */}
                  <div className="mb-6">
                    <div className="flex items-center gap-6">
                      <div>
                        <Avatar className="h-24 w-24">
                          <AvatarImage 
                            src={avatarPreview || 
                              (user.avatar?.startsWith('/uploads') ? user.avatar : 
                              (user.avatar ? `/uploads/${user.avatar.split('/').pop()}` : undefined))} 
                            alt={user.fullName || "Аватар"} 
                            onError={(e) => {
                              console.log("Ошибка загрузки аватара:", user.avatar);
                              e.currentTarget.src = '/uploads/default.jpg';
                            }}
                          />
                          <AvatarFallback>
                            <User className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-medium dark:text-gray-100">Фото профиля</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Это изображение будет отображаться в вашем профиле
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                          >
                            {uploadingAvatar ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Загрузка...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Загрузить фото
                              </>
                            )}
                          </Button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-100">ФИО</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Иванов Иван Иванович" 
                                className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription className="dark:text-gray-400">
                              Ваше полное имя, как оно будет отображаться на сайте
                            </FormDescription>
                            <FormMessage className="dark:text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-100">Электронная почта</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="example@mail.ru" 
                                className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription className="dark:text-gray-400">
                              Email для связи и уведомлений
                            </FormDescription>
                            <FormMessage className="dark:text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-100">Телефон</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+7 (000) 000-00-00" 
                                className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription className="dark:text-gray-400">
                              Номер телефона для связи
                            </FormDescription>
                            <FormMessage className="dark:text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <CardFooter className="flex justify-between px-0">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate("/dashboard")}
                        >
                          Отмена
                        </Button>
                        <Button 
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Сохранение...
                            </>
                          ) : "Сохранить изменения"}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="password">
              <Card className="dark:bg-gray-900 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">Изменение пароля</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Обновите свой пароль для повышения безопасности аккаунта
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-100">Текущий пароль</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showCurrentPassword ? "text" : "password"}
                                  placeholder="Введите текущий пароль" 
                                  className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500 pr-10"
                                  {...field} 
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                            <FormMessage className="dark:text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-100">Новый пароль</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showNewPassword ? "text" : "password"}
                                  placeholder="Введите новый пароль" 
                                  className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500 pr-10"
                                  {...field} 
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                            <FormDescription className="dark:text-gray-400">
                              Минимум 8 символов
                            </FormDescription>
                            <FormMessage className="dark:text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-100">Подтвердите новый пароль</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Повторите новый пароль" 
                                  className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500 pr-10"
                                  {...field} 
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                            <FormMessage className="dark:text-red-400" />
                          </FormItem>
                        )}
                      />
                      
                      <CardFooter className="flex justify-between px-0">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab("profile")}
                        >
                          Назад
                        </Button>
                        <Button 
                          type="submit"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Изменение пароля...
                            </>
                          ) : "Изменить пароль"}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}