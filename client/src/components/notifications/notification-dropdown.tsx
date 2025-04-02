import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { useNotifications } from "@/hooks/use-notifications";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [open, setOpen] = useState(false);

  // Если пользователь открывает дропдаун, мы обрабатываем открытие и чтение уведомлений
  useEffect(() => {
    if (open && unreadCount > 0) {
      // Не будем автоматически отмечать все как прочитанные при открытии
      // Пользователь должен сам нажать кнопку "Отметить все как прочитанные"
    }
  }, [open, unreadCount]);

  // Форматирование даты
  const formatNotificationDate = (date: Date | null) => {
    if (!date) return "";
    return format(new Date(date), "d MMMM, HH:mm", { locale: ru });
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

  // Обработчик клика по уведомлению
  const handleNotificationClick = (notificationId: number) => {
    markAsRead(notificationId);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative" size="icon">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge 
              className="px-1 min-w-[18px] h-[18px] absolute -top-1 -right-1 text-xs rounded-full flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Уведомления</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs" 
              onClick={() => markAllAsRead()}
            >
              Отметить все как прочитанные
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Загрузка уведомлений...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">У вас нет уведомлений</div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <DropdownMenuGroup className="max-h-[300px]">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <DropdownMenuItem 
                    className={`flex flex-col items-start cursor-pointer p-3 ${notification.read === false ? 'bg-accent/50' : ''}`}
                    asChild
                  >
                    <Link 
                      to={getNotificationUrl(notification)} 
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium">
                            {getNotificationTitle(notification)}
                            {notification.read === false && (
                              <span className="ml-2 text-xs px-1 py-0.5 bg-primary text-primary-foreground rounded">
                                Новое
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatNotificationDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </DropdownMenuGroup>
          </ScrollArea>
        )}

      </DropdownMenuContent>
    </DropdownMenu>
  );
}