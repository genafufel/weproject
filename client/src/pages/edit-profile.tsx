import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

// Создаем схему валидации для формы редактирования профиля
const profileSchema = z.object({
  fullName: z.string().min(2, { message: "ФИО должно содержать не менее 2 символов" }),
  email: z.string().email({ message: "Введите корректный email" }),
  phone: z.string().min(10, { message: "Номер телефона должен содержать не менее 10 цифр" }),
  avatar: z.string().url({ message: "Введите корректный URL изображения" }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
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
      avatar: user.avatar || "",
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
                  
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL аватара</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/avatar.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Ссылка на изображение для вашего профиля
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