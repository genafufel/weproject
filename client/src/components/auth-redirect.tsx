import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { saveReturnUrl } from "@/lib/utils";

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthRedirect({ children, redirectTo = "/auth" }: AuthRedirectProps) {
  const [location, navigate] = useLocation();

  const handleClick = () => {
    // Сохраняем текущий URL для перенаправления после авторизации
    saveReturnUrl(location);
    // Переходим на страницу авторизации
    navigate(redirectTo);
  };

  return (
    <Button onClick={handleClick}>
      {children}
    </Button>
  );
}