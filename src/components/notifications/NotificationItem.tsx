import { useUserNotifications } from "@/hooks/useUserNotifications";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    content: string;
    priority: string;
    is_read: boolean;
    created_at: string;
    action_url: string | null;
    action_label: string | null;
  };
}

const getNotificationIcon = (priority: string) => {
  switch (priority) {
    case 'high':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'medium':
      return <Info className="h-5 w-5 text-orange-500" />;
    case 'low':
      return <CheckCircle className="h-5 w-5 text-blue-500" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
};

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { markAsRead, deleteNotification } = useUserNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  return (
    <div
      className={cn(
        "p-4 hover:bg-accent/50 transition-colors cursor-pointer relative group",
        !notification.is_read && "bg-accent/30"
      )}
      onClick={handleClick}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex gap-3 pr-8">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.priority)}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-sm font-medium leading-none",
              !notification.is_read && "font-semibold"
            )}>
              {notification.title}
            </h4>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.content}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: fr
            })}
          </p>
        </div>
      </div>
      
      {!notification.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
      )}
    </div>
  );
};
