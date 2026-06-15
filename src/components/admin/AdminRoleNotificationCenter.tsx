import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminRoleNotifications } from "@/hooks/useAdminRoleNotifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCheck, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

export const AdminRoleNotificationCenter = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useAdminRoleNotifications();

  const getCategoryIcon = (category: string, priority: string) => {
    if (priority === 'urgent' || category.includes('error')) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (category.includes('warning') || category.includes('alert') || priority === 'high') {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
    if (category.includes('success') || category.includes('approved')) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    return <Info className="h-4 w-4 text-info" />;
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority || priority === 'normal' || priority === 'low') return null;
    
    return (
      <Badge 
        variant={priority === 'urgent' ? 'destructive' : 'default'}
        className="ml-2 text-xs"
      >
        {priority === 'urgent' ? '🔴 URGENT' : '⚠️ Prioritaire'}
      </Badge>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications Admin</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-accent/30' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getCategoryIcon(notification.category, notification.priority)}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        {getPriorityBadge(notification.priority)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </p>
                        
                        {!notification.is_read && (
                          <Badge variant="secondary" className="text-xs">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
