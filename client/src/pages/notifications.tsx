import { useAuth } from "@/hooks/use-auth";
import { NotificationsList } from "@/components/notifications/notification-list";
import { Helmet, HelmetProvider } from "react-helmet-async";

export default function NotificationsPage() {
  const { user } = useAuth();

  // Редирект выполняется через ProtectedRoute в App.tsx

  return (
    <>
      <Helmet>
        <title>Уведомления | WeProject</title>
      </Helmet>

      <div className="container py-6 space-y-6">
        <h1 className="text-3xl font-bold">Центр уведомлений</h1>
        <p className="text-muted-foreground">
          Здесь вы можете просмотреть все уведомления о сообщениях, 
          заявках на ваши проекты и ответах на ваши заявки.
        </p>

        <NotificationsList />
      </div>
    </>
  );
}