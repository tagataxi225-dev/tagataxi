import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock } from 'lucide-react';
import { useFoodOrders } from '@/hooks/useFoodOrders';
import { OrderKanbanBoard } from '@/components/restaurant/orders/OrderKanbanBoard';
import { OrderFilters } from '@/components/restaurant/orders/OrderFilters';
import { OrderCard } from '@/components/restaurant/orders/OrderCard';
import { RestaurantOrderDeliveryPanel } from '@/components/restaurant/RestaurantOrderDeliveryPanel';
import { motion } from 'framer-motion';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { notificationSoundService } from '@/services/notificationSound';

export default function ModernRestaurantOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantAddress, setRestaurantAddress] = useState<string>('');
  const [restaurantProfile, setRestaurantProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [orderTimers, setOrderTimers] = useState<{ [key: string]: number }>({});

  const { fetchRestaurantOrders, updateOrderStatus, subscribeToOrders } = useFoodOrders();

  const handleRefresh = useCallback(async () => {
    await loadOrders();
  }, [restaurantId]);

  useEffect(() => {
    loadRestaurantProfile();
  }, []);

  useEffect(() => {
    if (restaurantId) {
      loadOrders();

      const unsubscribe = subscribeToOrders(
        restaurantId,
        async (newOrder) => {
          // Jouer le son de notification via le service
          await notificationSoundService.playNotificationSound('newOrder');

          toast({
            title: '🍽️ Nouvelle commande !',
            description: `Commande #${newOrder.order_number}`,
          });

          loadOrders();
        },
        () => loadOrders()
      );

      return unsubscribe;
    }
  }, [restaurantId]);

  // Timer for orders
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderTimers(prev => {
        const newTimers = { ...prev };
        orders.forEach(order => {
          const createdAt = new Date(order.created_at).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - createdAt) / 1000 / 60);
          newTimers[order.id] = elapsed;
        });
        return newTimers;
      });
    }, 10000);

    // Initial calculation
    const initialTimers: { [key: string]: number } = {};
    orders.forEach(order => {
      const createdAt = new Date(order.created_at).getTime();
      const elapsed = Math.floor((Date.now() - createdAt) / 1000 / 60);
      initialTimers[order.id] = elapsed;
    });
    setOrderTimers(initialTimers);

    return () => clearInterval(interval);
  }, [orders]);

  const loadRestaurantProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/restaurant/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('restaurant_profiles')
        .select('id, address, restaurant_name, coordinates, phone_number')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setRestaurantId(profile.id);
        setRestaurantAddress(profile.address || '');
        const coords = profile.coordinates as any;
        setRestaurantProfile({
          restaurant_name: profile.restaurant_name,
          address: profile.address,
          latitude: coords?.lat || coords?.latitude,
          longitude: coords?.lng || coords?.longitude,
          phone_number: profile.phone_number,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!restaurantId) return;

    try {
      const data = await fetchRestaurantOrders(restaurantId);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleConfirmOrder = async (orderId: string, prepTime: number) => {
    const success = await updateOrderStatus(orderId, 'confirmed', prepTime);
    if (success) {
      toast({
        title: 'Commande confirmée',
        description: `Temps de préparation: ${prepTime} min`,
      });
      loadOrders();
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      toast({
        title: 'Statut mis à jour',
        description: 'La commande a été mise à jour',
      });
      loadOrders();
    }
  };

  // Filter orders
  const activeOrders = useMemo(() => {
    let filtered = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.order_number?.toLowerCase().includes(query) ||
        o.delivery_phone?.includes(query) ||
        o.delivery_address?.toLowerCase().includes(query)
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    return filtered;
  }, [orders, searchQuery, statusFilter]);

  const completedOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  const orderCounts = useMemo(() => ({
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  }), [orders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalActive = Object.values(orderCounts).reduce((a, b) => a + b, 0);

  // handleRefresh moved to top with other hooks

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={loading || !restaurantId}>
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Compact Header */}
      {/* Header soft-modern */}
      <div className="rounded-2xl bg-card border border-border/40 p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Commandes</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Gérez vos commandes en temps réel</p>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1.5">
            <Clock className="h-4 w-4 mr-1.5" />
            {totalActive} actives
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        orderCounts={orderCounts}
      />

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-11">
          <TabsTrigger value="active" className="text-sm">
            Actives ({totalActive})
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm">
            Historique ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-0">
          {viewMode === 'kanban' ? (
            <OrderKanbanBoard
              orders={activeOrders}
              onStatusChange={handleStatusChange}
              onConfirmOrder={handleConfirmOrder}
              restaurantAddress={restaurantAddress}
              restaurantProfile={restaurantProfile}
              orderTimers={orderTimers}
            />
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order, index) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  elapsedMinutes={orderTimers[order.id] || 0}
                  onConfirm={order.status === 'pending' ? (prepTime) => handleConfirmOrder(order.id, prepTime) : undefined}
                  onStatusChange={(status) => handleStatusChange(order.id, status)}
                  nextStatus={getNextStatus(order.status)}
                  index={index}
                  onRefresh={handleRefresh}
                  showDeliveryPanel={['confirmed', 'preparing', 'ready'].includes(order.status) && !order.driver_id ? (
                    <RestaurantOrderDeliveryPanel
                      orderId={order.id}
                      orderStatus={order.status}
                      restaurantAddress={restaurantAddress}
                      deliveryAddress={order.delivery_address}
                      deliveryCoordinates={order.delivery_coordinates}
                      restaurantProfile={restaurantProfile}
                      deliveryPhone={order.delivery_phone}
                      orderNumber={order.order_number}
                      onStatusChange={handleRefresh}
                    />
                  ) : undefined}
                />
              ))}
            </div>
          )}

          {activeOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Aucune commande active</p>
                <p className="text-sm text-muted-foreground">Les nouvelles commandes apparaîtront ici</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3 mt-0">
          {completedOrders.slice(0, 20).map((order, index) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">#{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{order.total_amount.toLocaleString()} CDF</p>
                    <Badge variant={order.status === 'delivered' ? 'default' : 'destructive'}>
                      {order.status === 'delivered' ? 'Livré' : 'Annulé'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {completedOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Aucune commande dans l'historique</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </PullToRefresh>
  );
}

function getNextStatus(currentStatus: string): string | undefined {
  const statusFlow: { [key: string]: string } = {
    pending: 'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'picked_up',
  };
  return statusFlow[currentStatus];
}
