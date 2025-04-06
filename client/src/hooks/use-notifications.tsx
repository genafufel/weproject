import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import type { Notification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
import { websocketService } from "@/lib/websocket";

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isAuthenticated = !!user;
  
  // Подключаем WebSocket для получения уведомлений в реальном времени
  useEffect(() => {
    if (user?.id) {
      // Подключаемся к WebSocket серверу с ID пользователя для аутентификации
      websocketService.connect(user.id);
      
      // Отключаемся при размонтировании компонента
      return () => {
        websocketService.disconnect();
      };
    }
  }, [user?.id]);

  // Получение всех уведомлений пользователя
  const { 
    data: notifications = [], 
    isLoading: isLoadingNotifications,
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery<Notification[]>({ 
    queryKey: ['/api/notifications'],
    enabled: isAuthenticated,
  });

  // Получение количества непрочитанных уведомлений
  const { 
    data: unreadCount = { count: 0 }, 
    isLoading: isLoadingUnreadCount,
    error: unreadCountError,
    refetch: refetchUnreadCount
  } = useQuery<{ count: number }>({ 
    queryKey: ['/api/notifications/unread/count'],
    enabled: isAuthenticated,
  });

  // Мутация для отметки уведомления как прочитанного
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      // Инвалидируем кэши для уведомлений и счетчика непрочитанных уведомлений
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось отметить уведомление как прочитанное: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Мутация для отметки всех уведомлений как прочитанных
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/notifications/read-all");
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
        
        toast({
          title: "Успешно",
          description: "Все уведомления отмечены как прочитанные"
        });
      } else {
        toast({
          title: "Нет непрочитанных уведомлений",
          description: data.message
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось отметить все уведомления как прочитанные: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Мутация для создания нового уведомления (обычно не используется напрямую клиентом)
  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      const res = await apiRequest("POST", "/api/notifications", notificationData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось создать уведомление: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    notifications,
    unreadCount: unreadCount.count,
    isLoading: isLoadingNotifications || isLoadingUnreadCount,
    error: notificationsError || unreadCountError,
    markAsRead: (id: number) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    createNotification: (data: any) => createNotificationMutation.mutate(data),
    refetchNotifications,
    refetchUnreadCount
  };
}