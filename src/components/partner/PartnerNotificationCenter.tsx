import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X,
  Settings,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { usePartnerNotifications } from '@/hooks/usePartnerNotifications';

export const PartnerNotificationCenter: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const { toast } = useToast();
  const { 
    notifications: rawNotifications, 
    unreadCount: apiUnreadCount,
    loading,
    markAsRead: apiMarkAsRead, 
    markAllAsRead: apiMarkAllAsRead 
  } = usePartnerNotifications();

  // Transform API notifications to component format
  const notifications = rawNotifications.map(n => ({
    id: n.id,
    type: n.type as 'success' | 'warning' | 'info' | 'error',
    title: n.title,
    message: n.message,
    timestamp: new Date(n.created_at),
    isRead: n.is_read,
    actionRequired: n.type === 'warning' || n.type === 'error',
    metadata: n.metadata
  }));

  const getNotificationIcon = (type: 'success' | 'warning' | 'info' | 'error') => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return X;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: 'success' | 'warning' | 'info' | 'error') => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-orange-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const markAsRead = async (id: string) => {
    await apiMarkAsRead(id);
  };

  const markAllAsRead = async () => {
    await apiMarkAllAsRead();
    toast({
      title: "Notifications marquées comme lues",
      description: "Toutes vos notifications ont été marquées comme lues."
    });
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      return `il y a ${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `il y a ${Math.floor(diffInMinutes / 1440)} jour(s)`;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread':
        return !notif.isRead;
      case 'important':
        return notif.actionRequired;
      default:
        return true;
    }
  });

  const unreadCount = apiUnreadCount;
  const importantCount = notifications.filter(n => n.actionRequired && !n.isRead).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-muted rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Centre de Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Gérez vos alertes et mises à jour importantes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Tout marquer lu
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Non lues</p>
              <p className="text-2xl font-bold">{unreadCount}</p>
            </div>
            <Bell className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Importantes</p>
              <p className="text-2xl font-bold">{importantCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{notifications.length}</p>
            </div>
            <Info className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
        <TabsList>
          <TabsTrigger value="all">
            Toutes ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Non lues ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="important">
            Importantes ({importantCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          <AnimatePresence>
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {filter === 'unread' ? 'Aucune notification non lue' :
                     filter === 'important' ? 'Aucune notification importante' :
                     'Aucune notification'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                        !notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full bg-background ${iconColor}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold flex items-center gap-2">
                                  {notification.title}
                                  {notification.actionRequired && (
                                    <Badge variant="destructive" className="text-xs">
                                      Action requise
                                    </Badge>
                                  )}
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                  )}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(notification.timestamp)}
                              </div>
                              
                              {notification.actionRequired && (
                                <Button variant="outline" size="sm">
                                  Agir
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
};