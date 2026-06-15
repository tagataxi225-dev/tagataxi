import { AdminSystemNotification } from "@/types/adminNotifications";
import { useAdminSystemNotifications } from "@/hooks/useAdminSystemNotifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ShoppingBag,
  UserCheck,
  MessageSquare
} from "lucide-react";

interface AdminNotificationItemProps {
  notification: AdminSystemNotification;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    className: "text-destructive bg-destructive/10"
  },
  warning: {
    icon: AlertTriangle,
    className: "text-warning bg-warning/10"
  },
  success: {
    icon: CheckCircle,
    className: "text-success bg-success/10"
  },
  info: {
    icon: Info,
    className: "text-info bg-info/10"
  }
};

const typeIcons = {
  product_moderation: ShoppingBag,
  user_verification: UserCheck,
  support_ticket: MessageSquare
};

export const AdminNotificationItem = ({ notification }: AdminNotificationItemProps) => {
  const { markAsRead } = useAdminSystemNotifications();
  
  const SeverityIcon = severityConfig[notification.severity]?.icon || Info;
  const TypeIcon = typeIcons[notification.type as keyof typeof typeIcons] || Info;
  
  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
        !notification.is_read && "bg-primary/5"
      )}
    >
      <div className="flex gap-3">
        <div className={cn(
          "flex-shrink-0 rounded-full p-2",
          severityConfig[notification.severity]?.className
        )}>
          <SeverityIcon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TypeIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <p className="text-sm font-medium leading-tight truncate">
                {notification.title}
              </p>
            </div>
            {!notification.is_read && (
              <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: fr
              })}
            </span>
            {notification.data?.product_id && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                ID: {notification.data.product_id.substring(0, 8)}...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
