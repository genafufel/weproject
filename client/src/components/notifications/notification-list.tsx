import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "wouter";
import { Bell, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function NotificationsList() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  // Форматирование даты
  const formatNotificationDate = (date: Date | null) => {
    if (!date) return "";
    return format(new Date(date), "d MMMM yyyy, HH:mm", { locale: ru });
  };

  // Получение URL для навигации в зависимости от типа уведомления
  const getNotificationUrl = (notification: any) => {
    switch (notification.type) {
      case "message":
        return "/messages";
      case "application":
        return `/projects/${notification.projectId}`;
      case "application_response":
        return `/applications/${notification.applicationId}`;
      default:
        return "/dashboard";
    }
  };

  // Получение заголовка уведомления в зависимости от типа
  const getNotificationTitle = (notification: any) => {
    switch (notification.type) {
      case "message":
        return "Новое сообщение";
      case "application":
        return "Новая заявка на проект";
      case "application_response":
        return "Ответ на вашу заявку";
      default:
        return "Уведомление";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <CardDescription>У вас пока нет уведомлений</CardDescription>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Уведомления 
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} новых
            </Badge>
          )}
        </h2>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
            Отметить все как прочитанные
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`${notification.read === false ? 'border-primary border-2' : ''}`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {getNotificationTitle(notification)}
                    {notification.read === false && (
                      <Badge variant="default" className="ml-2">
                        Новое
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {formatNotificationDate(notification.createdAt)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p>{notification.message}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => markAsRead(notification.id)}
                disabled={notification.read === true}
              >
                {notification.read === true ? "Прочитано" : "Отметить как прочитанное"}
              </Button>
              <Button asChild>
                <Link to={getNotificationUrl(notification)}>
                  Перейти
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}