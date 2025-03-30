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
import { Loader2, Upload, User, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Создаем схему валидации для формы редактирования профиля
const profileSchema = z.object({
  fullName: z.string().min(2, { message: "ФИО должно содержать не менее 2 символов" }),
  email: z.string().email({ message: "Введите корректный email" }),
  phone: z.string().min(10, { message: "Номер телефона должен содержать не менее 10 цифр" }),

});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  
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
      
      // Обновляем данные пользователя в контексте авторизации
      // Здесь мы выполняем повторный вход для обновления данных пользователя
      loginMutation.mutate({ username: user.username, password: "" }, {
        onSuccess: () => {
          navigate("/dashboard");
        }
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка обновления профиля",
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
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Редактирование профиля</h1>
            <p className="mt-1 text-gray-600">
              Обновите свою информацию для лучшей видимости в поиске.
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Информация профиля</CardTitle>
              <CardDescription>
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
                        src={avatarPreview || user.avatar || undefined} 
                        alt={user.fullName || "Аватар"} 
                      />
                      <AvatarFallback>
                        <User className="h-12 w-12 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-medium">Фото профиля</h3>
                    <p className="text-sm text-gray-500">
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
                        <FormLabel>ФИО</FormLabel>
                        <FormControl>
                          <Input placeholder="Иванов Иван Иванович" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ваше полное имя, как оно будет отображаться на сайте
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Электронная почта</FormLabel>
                        <FormControl>
                          <Input placeholder="example@mail.ru" {...field} />
                        </FormControl>
                        <FormDescription>
                          Email для связи и уведомлений
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="+7 (000) 000-00-00" {...field} />
                        </FormControl>
                        <FormDescription>
                          Номер телефона для связи
                        </FormDescription>
                        <FormMessage />
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
        </div>
      </main>
      
      <Footer />
    </div>
  );
}