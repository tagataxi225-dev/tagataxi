import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, CheckCheck, Search, Filter, Archive,
  Trash2, MoreHorizontal, Car, Package, ShoppingBag,
  Utensils, Gift, MessageCircle, CreditCard, Settings,
  ChevronRight, Inbox, X, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NotificationLog {
  id: string;
  title: string;
  message: string | null;
  category: string | null;
  priority: string | null;
  is_read: boolean;
  is_archived: boolean;
  action_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

const CATEGORY_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  transport: { icon: Car, label: 'Transport', color: 'text-blue-500' },
  delivery: { icon: Package, label: 'Livraison', color: 'text-orange-500' },
  marketplace: { icon: ShoppingBag, label: 'Marketplace', color: 'text-purple-500' },
  food: { icon: Utensils, label: 'Food', color: 'text-red-500' },
  lottery: { icon: Gift, label: 'Loterie', color: 'text-yellow-500' },
  chat: { icon: MessageCircle, label: 'Chat', color: 'text-green-500' },
  payment: { icon: CreditCard, label: 'Paiement', color: 'text-emerald-500' },
  system: { icon: Settings, label: 'Système', color: 'text-gray-500' },
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-l-4 border-l-destructive bg-destructive/5',
  high: 'border-l-4 border-l-orange-500 bg-orange-500/5',
  normal: '',
  low: 'opacity-80',
};

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notification-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from('user_notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return (data || []) as NotificationLog[];
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase as any)
        .from('user_notification_logs')
        .update({ is_read: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setSelectedIds(new Set());
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase as any)
        .from('user_notification_logs')
        .update({ is_archived: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setSelectedIds(new Set());
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase as any)
        .from('user_notification_logs')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      setSelectedIds(new Set());
    },
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Tab filter
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(n => n.category === activeTab);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        (n.message?.toLowerCase() || '').includes(query)
      );
    }

    return filtered;
  }, [notifications, activeTab, searchQuery]);

  // Group by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationLog[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    filteredNotifications.forEach(notification => {
      const date = new Date(notification.created_at);
      if (isToday(date)) {
        groups.today.push(notification);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleNotificationClick = (notification: NotificationLog) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate([notification.id]);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const renderNotification = (notification: NotificationLog) => {
    const config = CATEGORY_CONFIG[notification.category || 'system'];
    const Icon = config?.icon || Bell;
    const isSelected = selectedIds.has(notification.id);

    return (
      <motion.div
        key={notification.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer",
          !notification.is_read ? "bg-primary/5" : "hover:bg-muted/50",
          isSelected && "ring-2 ring-primary",
          PRIORITY_STYLES[notification.priority || 'normal']
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        {/* Selection checkbox */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleSelect(notification.id);
          }}
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
            isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>

        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 p-2 rounded-lg",
          !notification.is_read ? "bg-primary/10" : "bg-muted"
        )}>
          <Icon className={cn("h-4 w-4", config?.color || "text-muted-foreground")} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={cn(
              "text-sm truncate",
              !notification.is_read ? "font-semibold" : "font-medium"
            )}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          
          {notification.message && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {config?.label || 'Autre'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: fr
              })}
            </span>
          </div>
        </div>

        {/* Action menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!notification.is_read && (
              <DropdownMenuItem onClick={() => markAsReadMutation.mutate([notification.id])}>
                <Check className="h-4 w-4 mr-2" />
                Marquer comme lu
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => archiveMutation.mutate([notification.id])}>
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => deleteMutation.mutate([notification.id])}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  };

  const renderSection = (title: string, items: NotificationLog[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
          {title}
        </h3>
        <AnimatePresence mode="popLayout">
          {items.map(renderNotification)}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge>{unreadCount} non lues</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Non lues
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2 bg-muted rounded-lg"
          >
            <span className="text-sm font-medium">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsReadMutation.mutate(Array.from(selectedIds))}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marquer lu
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => archiveMutation.mutate(Array.from(selectedIds))}
            >
              <Archive className="h-4 w-4 mr-1" />
              Archiver
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery ? 'Aucun résultat' : 'Aucune notification'}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {searchQuery ? 'Essayez une autre recherche' : 'Vous êtes à jour !'}
              </p>
            </motion.div>
          ) : (
            <>
              {renderSection("Aujourd'hui", groupedNotifications.today)}
              {renderSection("Hier", groupedNotifications.yesterday)}
              {renderSection("Plus ancien", groupedNotifications.earlier)}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NotificationCenter;
