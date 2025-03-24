import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function VerificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Функция для отправки кода верификации
  const sendVerificationCode = async () => {
    if (countdown > 0) return;
    
    setSendingCode(true);
    try {
      const response = await apiRequest("POST", "/api/send-verification");
      const data = await response.json();
      
      toast({
        title: "Код отправлен",
        description: data.message,
      });
      
      // Запускаем обратный отсчет в 60 секунд
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить код подтверждения",
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  };

  // Функция для проверки кода верификации
  const verifyCode = async () => {
    if (!verificationCode) {
      toast({
        title: "Ошибка",
        description: "Введите код подтверждения",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/verify", { code: verificationCode });
      const data = await response.json();
      
      toast({
        title: "Успех",
        description: data.message,
      });
      
      // Обновляем состояние пользователя (это произойдет автоматически через хук useAuth)
      window.location.href = "/"; // Перенаправляем на главную страницу
      
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Неверный код подтверждения",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Определение текста в зависимости от метода аутентификации
  const authTypeText = user?.authType === "email" 
    ? `на вашу электронную почту ${user?.email}` 
    : `на ваш телефон ${user?.phone}`;
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">Подтверждение аккаунта</CardTitle>
          <CardDescription className="text-center">
            Для доступа к платформе необходимо подтвердить ваш аккаунт
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Мы отправим код подтверждения {authTypeText}. 
            Введите полученный код для подтверждения вашего аккаунта.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Input
              placeholder="Введите код подтверждения"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={verifyCode}
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Проверка...
              </>
            ) : (
              "Подтвердить код"
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={sendVerificationCode}
            className="w-full"
            disabled={sendingCode || countdown > 0}
          >
            {sendingCode ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : countdown > 0 ? (
              `Отправить код повторно (${countdown}с)`
            ) : (
              "Отправить код"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}