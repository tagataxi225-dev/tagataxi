import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Search, Filter, Archive, Settings, 
  CheckCircle2, Clock, SortDesc, RefreshCw,
  Calendar, User, AlertTriangle, Info
} from 'lucide-react';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import NotificationCard from '@/components/notifications/NotificationCard';
import NotificationToast from '@/components/notifications/NotificationToast';
import NotificationBadge from '@/components/notifications/NotificationBadge';
import NotificationSettings from '@/components/notifications/NotificationSettings';

interface FilterOptions {
  type: string;
  read: 'all' | 'read' | 'unread';
  priority: 'all' | 'high' | 'normal' | 'low';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

const ModernNotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useEnhancedNotifications();
  const { isGranted, requestPermission } = useNotificationPermissions();
  const { preferences } = useNotificationPreferences();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    read: 'all',
    priority: 'all',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState<'timestamp' | 'priority' | 'type'>('timestamp');
  const [activeTab, setActiveTab] = useState('notifications');
  const [toasts, setToasts] = useState<Array<any>>([]);

  // Filter and search notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filters.type === 'all' || notification.type === filters.type;
    
    const matchesRead = filters.read === 'all' || 
                       (filters.read === 'read' && notification.read) ||
                       (filters.read === 'unread' && !notification.read);
    
    const matchesPriority = filters.priority === 'all' || 
                           notification.metadata?.priority === filters.priority;
    
    const matchesDate = (() => {
      if (filters.dateRange === 'all') return true;
      
      const notifDate = new Date(notification.timestamp);
      const now = new Date();
      const diffTime = now.getTime() - notifDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      switch (filters.dateRange) {
        case 'today': return diffDays === 0;
        case 'week': return diffDays <= 7;
        case 'month': return diffDays <= 30;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesType && matchesRead && matchesPriority && matchesDate;
  });

  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const aPriority = priorityOrder[a.metadata?.priority as keyof typeof priorityOrder] || 2;
        const bPriority = priorityOrder[b.metadata?.priority as keyof typeof priorityOrder] || 2;
        return bPriority - aPriority;
      
      case 'type':
        return a.type.localeCompare(b.type);
      
      default:
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
  });

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      read: 'all',
      priority: 'all',
      dateRange: 'all'
    });
    setSearchQuery('');
  };

  const getNotificationTypes = () => {
    const types = Array.from(new Set(notifications.map(n => n.type)));
    return types;
  };

  const addToast = (toast: any) => {
    setToasts(prev => [...prev, { ...toast, id: crypto.randomUUID() }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-8 w-8 text-primary" />
            <NotificationBadge 
              count={unreadCount} 
              className="absolute -top-2 -right-2" 
              size="sm"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Centre de notifications</h1>
            <p className="text-muted-foreground">
              Gérez toutes vos notifications en un seul endroit
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isGranted && (
            <Button variant="outline" onClick={requestPermission}>
              <Bell className="h-4 w-4 mr-2" />
              Activer les notifications
            </Button>
          )}
          
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Tout marquer lu ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <NotificationBadge count={unreadCount} size="sm" />
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans les notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {getNotificationTypes().map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.read} onValueChange={(value) => setFilters(prev => ({ ...prev, read: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="unread">Non lues</SelectItem>
                      <SelectItem value="read">Lues</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes priorités</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toute période</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2">
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Trier par" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="timestamp">Date</SelectItem>
                        <SelectItem value="priority">Priorité</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{notifications.length}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold">{unreadCount}</p>
                    <p className="text-xs text-muted-foreground">Non lues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
                    <p className="text-xs text-muted-foreground">Lues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">
                      {notifications.filter(n => {
                        const diff = Date.now() - new Date(n.timestamp).getTime();
                        return diff < 24 * 60 * 60 * 1000;
                      }).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Notifications ({filteredNotifications.length})
              </h3>
              {notifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearNotifications}>
                  <Archive className="h-4 w-4 mr-2" />
                  Tout effacer
                </Button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {sortedNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucune notification</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || Object.values(filters).some(f => f !== 'all')
                          ? 'Aucune notification ne correspond à vos critères de recherche'
                          : 'Vous n\'avez aucune notification pour le moment'
                        }
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                sortedNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NotificationCard
                      {...notification}
                      onMarkAsRead={markAsRead}
                      onClick={(id) => {
                        if (!notification.read) {
                          markAsRead(id);
                        }
                      }}
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>
      </Tabs>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ModernNotificationCenter;