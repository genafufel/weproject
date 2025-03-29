import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Базовые схемы для разных типов аутентификации
const baseAuthSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  bio: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  userType: z.string().optional()
});

// Схема для аутентификации по email
const emailAuthSchema = baseAuthSchema.extend({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  authType: z.literal("email")
});

// Схема для аутентификации по телефону
const phoneAuthSchema = baseAuthSchema.extend({
  email: z.string().optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  authType: z.literal("phone")
});

// Объединенная схема для регистрации
const extendedUserSchema = z.discriminatedUnion("authType", [
  emailAuthSchema,
  phoneAuthSchema
])
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<SelectUser, "password">, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<SelectUser, "password">, Error, RegisterData>;
};

type LoginData = Pick<InsertUser, "username" | "password">;
type RegisterData = z.infer<typeof extendedUserSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: Omit<SelectUser, "password">) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registrationData } = userData;
      const res = await apiRequest("POST", "/api/register", registrationData);
      return await res.json();
    },
    onSuccess: (userData: Omit<SelectUser, "password"> & { verificationSent?: boolean, verificationMessage?: string }) => {
      queryClient.setQueryData(["/api/user"], userData);
      
      // Отображаем сообщение о верификации, если есть
      if (userData.verificationMessage) {
        toast({
          title: "Регистрация успешна",
          description: userData.verificationMessage,
        });
      } else {
        toast({
          title: "Регистрация успешна",
          description: `Добро пожаловать в weproject, ${userData.fullName}!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
