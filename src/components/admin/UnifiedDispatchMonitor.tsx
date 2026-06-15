import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { 
  Car, 
  Package, 
  ShoppingBag, 
  Users, 
  Activity, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAddressForDisplay } from '@/utils/googleMapsUnified';

interface DispatchItem {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace';
  status: string;
  customer_name: string;
  driver_name?: string;
  pickup_location: string;
  destination: string;
  created_at: string;
  estimated_price: number;
  priority: 'low' | 'medium' | 'high';
}

interface DriverStatus {
  id: string;
  name: string;
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation?: { lat: number; lng: number };
  activeOrders: number;
  serviceTypes: string[];
  lastSeen: string;
}

const UnifiedDispatchMonitor: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState<DriverStatus[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    completedToday: 0,
    onlineDrivers: 0,
    availableDrivers: 0
  });

  // Load dispatch data
  const loadDispatchData = async () => {
    setLoading(true);
    try {
      // Load taxi orders
      const { data: taxiOrders } = await supabase
        .from('ride_requests')
        .select(`
          id,
          status,
          pickup_location,
          destination,
          estimated_price,
          created_at,
          assigned_driver_id,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Load delivery orders
      const { data: deliveryOrders } = await supabase
        .from('delivery_orders')
        .select(`
          id,
          status,
          pickup_location,
          delivery_location,
          estimated_price,
          created_at,
          driver_id,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Load marketplace orders
      const { data: marketplaceOrders } = await supabase
        .from('marketplace_orders')
        .select(`
          id,
          status,
          delivery_address,
          total_amount,
          created_at,
          buyer_id,
          seller_id,
          marketplace_delivery_assignments(
            id,
            pickup_location,
            delivery_location,
            assignment_status,
            driver_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Format all orders
      const allItems: DispatchItem[] = [
        ...(taxiOrders || []).map(order => ({
          id: order.id,
          type: 'taxi' as const,
          status: order.status,
          customer_name: 'Client',
          driver_name: order.assigned_driver_id ? 'Chauffeur' : undefined,
          pickup_location: order.pickup_location,
          destination: order.destination,
          created_at: order.created_at,
          estimated_price: order.estimated_price || 0,
          priority: (order.status === 'pending' ? 'high' : 'medium') as 'low' | 'medium' | 'high'
        })),
        ...(deliveryOrders || []).map(order => ({
          id: order.id,
          type: 'delivery' as const,
          status: order.status,
          customer_name: 'Client',
          driver_name: order.driver_id ? 'Livreur' : undefined,
          pickup_location: order.pickup_location,
          destination: order.delivery_location,
          created_at: order.created_at,
          estimated_price: order.estimated_price || 0,
          priority: (order.status === 'pending' ? 'medium' : 'low') as 'low' | 'medium' | 'high'
        })),
        ...(marketplaceOrders || []).map(order => ({
          id: order.id,
          type: 'marketplace' as const,
          status: order.status,
          customer_name: 'Acheteur',
          driver_name: order.marketplace_delivery_assignments?.[0]?.driver_id ? 'Livreur' : undefined,
          pickup_location: order.marketplace_delivery_assignments?.[0]?.pickup_location || 'Vendeur',
          destination: order.delivery_address || 'À définir',
          created_at: order.created_at,
          estimated_price: order.total_amount || 0,
          priority: 'high' as 'low' | 'medium' | 'high'
        }))
      ];

      setDispatchItems(allItems);

      // Update stats
      setStats({
        totalOrders: allItems.length,
        pendingOrders: allItems.filter(item => ['pending', 'dispatching'].includes(item.status)).length,
        activeOrders: allItems.filter(item => ['accepted', 'in_progress', 'picked_up'].includes(item.status)).length,
        completedToday: allItems.filter(item => 
          ['completed', 'delivered'].includes(item.status) && 
          new Date(item.created_at).toDateString() === new Date().toDateString()
        ).length,
        onlineDrivers: 0, // Will be updated below
        availableDrivers: 0
      });

    } catch (error) {
      console.error('Error loading dispatch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load driver statuses
  const loadDriverStatuses = async () => {
    try {
      const { data: drivers } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          is_online,
          is_available,
          latitude,
          longitude,
          last_ping,
          driver_profiles(user_id)
        `)
        .eq('is_online', true);

      const driverStatuses: DriverStatus[] = await Promise.all(
        (drivers || []).map(async (driver) => ({
          id: driver.driver_id,
          name: 'Chauffeur',
          isOnline: driver.is_online,
          isAvailable: driver.is_available,
          currentLocation: (driver as any).google_address ? 
            await extractGoogleCoordinates((driver as any).google_address) :
            (driver.latitude && driver.longitude ? {
              lat: driver.latitude,
              lng: driver.longitude
            } : undefined),
          activeOrders: 0, // Would need to count from orders
          serviceTypes: ['taxi', 'delivery'],
          lastSeen: driver.last_ping
        }))
      );

      setOnlineDrivers(driverStatuses);

      // Update driver stats
      setStats(prev => ({
        ...prev,
        onlineDrivers: driverStatuses.length,
        availableDrivers: driverStatuses.filter(d => d.isAvailable).length
      }));

    } catch (error) {
      console.error('Error loading driver statuses:', error);
    }
  };

  // Helper for coordinate extraction from Google addresses
  const extractGoogleCoordinates = async (googleAddress: string) => {
    try {
      const { extractCoordinatesFromFallback } = await import('@/utils/googleMapsUnified');
      return extractCoordinatesFromFallback(googleAddress);
    } catch {
      return undefined;
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    loadDispatchData();
    loadDriverStatuses();

    // Set up real-time listeners
    const ordersChannel = supabase
      .channel('admin-dispatch-monitor')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ride_requests'
      }, () => loadDispatchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'delivery_orders'
      }, () => loadDispatchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketplace_orders'
      }, () => loadDispatchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_locations'
      }, () => loadDriverStatuses())
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [user]);

  // Filter items
  const filteredItems = dispatchItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.pickup_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'dispatching':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
      case 'in_progress':
      case 'picked_up':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'completed':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'taxi':
        return <Car className="h-4 w-4 text-blue-500" />;
      case 'delivery':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'marketplace':
        return <ShoppingBag className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-green-500 text-white'
    };
    return (
      <Badge className={cn("text-xs", colors[priority as keyof typeof colors])}>
        {priority}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <div className="text-xs text-muted-foreground">Total commandes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
            <div className="text-xs text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.activeOrders}</div>
            <div className="text-xs text-muted-foreground">En cours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            <div className="text-xs text-muted-foreground">Terminées aujourd'hui</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.onlineDrivers}</div>
            <div className="text-xs text-muted-foreground">Chauffeurs en ligne</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-500">{stats.availableDrivers}</div>
            <div className="text-xs text-muted-foreground">Disponibles</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="drivers">Chauffeurs</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par lieu ou client..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="accepted">Accepté</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="taxi">Taxi</SelectItem>
                    <SelectItem value="delivery">Livraison</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadDispatchData} disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes ({filteredItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 p-4">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            <span className="font-semibold text-sm">
                              {item.type === 'taxi' ? 'Course' : 
                               item.type === 'delivery' ? 'Livraison' : 'Marketplace'}
                            </span>
                            {getPriorityBadge(item.priority)}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <span className="text-sm text-muted-foreground">{item.status}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{item.pickup_location} → {item.destination}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Client: {item.customer_name}
                              {item.driver_name && ` • ${item.driver_name}`}
                            </span>
                            <span className="font-semibold">
                              {item.estimated_price.toLocaleString()} CDF
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(item.created_at).toLocaleString('fr-FR')}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Détails
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune commande trouvée
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          {/* Drivers List */}
          <Card>
            <CardHeader>
              <CardTitle>Chauffeurs en ligne ({onlineDrivers.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 p-4">
                  {onlineDrivers.map((driver) => (
                    <Card key={driver.id} className="border border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              driver.isAvailable ? "bg-green-500" : "bg-yellow-500"
                            )} />
                            <span className="font-semibold text-sm">{driver.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {driver.isAvailable ? 'Disponible' : 'Occupé'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {driver.activeOrders} commande(s) active(s)
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {driver.currentLocation 
                                ? `${driver.currentLocation.lat.toFixed(4)}, ${driver.currentLocation.lng.toFixed(4)}`
                                : 'Position inconnue'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Vu: {new Date(driver.lastSeen).toLocaleString('fr-FR')}</span>
                          </div>
                          <div className="flex gap-1">
                            {driver.serviceTypes.map(type => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type === 'taxi' ? 'Taxi' : type === 'delivery' ? 'Livraison' : 'Marketplace'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {onlineDrivers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun chauffeur en ligne
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedDispatchMonitor;