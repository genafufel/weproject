import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";

interface NotificationBadgeProps {
  className?: string;
}

export function NotificationBadge({ className = "" }: NotificationBadgeProps) {
  const { unreadCount, isLoading } = useNotifications();

  if (isLoading || unreadCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={`px-1 min-w-[18px] h-[18px] flex items-center justify-center ${className}`}
    >
      {unreadCount}
    </Badge>
  );
}