import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check as CheckIcon } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Имя пользователя, email или телефон обязательны"),
  password: z.string().min(1, "Пароль обязателен"),
});

// Base schema for registration
const baseRegisterSchema = z.object({
  username: z.string().min(3, "Имя пользователя должно быть не менее 3 символов"),
  password: z.string().min(8, "Пароль должен быть не менее 8 символов"),
  confirmPassword: z.string().min(1, "Подтвердите пароль"),
  fullName: z.string().min(1, "Полное имя обязательно"),
});

// Email registration schema
const emailRegisterSchema = baseRegisterSchema.extend({
  email: z.string().email("Неверный адрес электронной почты"),
  authType: z.literal('email'),
});

// Phone registration schema
const phoneRegisterSchema = baseRegisterSchema.extend({
  phone: z.string().min(10, "Телефон должен содержать не менее 10 цифр"),
  authType: z.literal('phone'),
});

// Registration form schema (combined)
const registerSchema = z.discriminatedUnion("authType", [
  emailRegisterSchema,
  phoneRegisterSchema
]).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [authType, setAuthType] = useState<"email" | "phone">("email");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      authType: "email",
      ...(authType === "email" ? { email: "" } : { phone: "" }),
    },
  });

  // Обновить форму при изменении типа аутентификации
  useEffect(() => {
    registerForm.setValue("authType", authType);
    
    if (authType === "email") {
      registerForm.setValue("phone", "");
    } else {
      registerForm.setValue("email", "");
    }
  }, [authType, registerForm]);

  // Handle login submission
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  // Handle registration submission
  const onRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Left side - Form section */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12">
        <div className="mb-8 flex justify-center md:justify-start">
          <Logo size="large" />
        </div>

        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Добро пожаловать в weproject
            </CardTitle>
            <CardDescription className="text-center">
              Найдите проекты и новые возможности
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя пользователя</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите имя пользователя" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пароль</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Введите пароль" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Вход...
                        </>
                      ) : (
                        "Войти"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Полное имя</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите полное имя" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя пользователя</FormLabel>
                          <FormControl>
                            <Input placeholder="Выберите имя пользователя" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Auth Type Selection */}
                    <div className="space-y-2">
                      <div className="flex justify-center gap-4 mb-2">
                        <Button
                          type="button"
                          variant={authType === "email" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setAuthType("email")}
                        >
                          Email
                        </Button>
                        <Button
                          type="button"
                          variant={authType === "phone" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setAuthType("phone")}
                        >
                          Телефон
                        </Button>
                      </div>

                      {authType === "email" ? (
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Введите email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Телефон</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="Введите номер телефона" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пароль</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Создайте пароль" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Подтверждение пароля</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Подтвердите пароль" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Создание аккаунта...
                        </>
                      ) : (
                        "Создать аккаунт"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              {activeTab === "login" ? (
                <>
                  Нет аккаунта?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setActiveTab("register")}
                  >
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setActiveTab("login")}
                  >
                    Войти
                  </button>
                </>
              )}
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden md:block w-1/2 bg-primary">
        <div className="h-full flex flex-col justify-center items-center p-12 text-white">
          <h1 className="text-4xl font-bold mb-6">Найдите свой проект</h1>
          <div className="max-w-md space-y-6">
            <p className="text-xl">
              weproject соединяет талантливых людей с интересными проектами в различных сферах.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 mt-1">
                  <CheckIcon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-3">Создайте своё портфолио с реальными проектами</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 mt-1">
                  <CheckIcon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-3">Работайте над интересными проектами и реализуйте свои идеи</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 mt-1">
                  <CheckIcon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-3">Получите ценный опыт в различных отраслях</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 mt-1">
                  <CheckIcon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-3">Найдите идеальных участников для вашего проекта</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
