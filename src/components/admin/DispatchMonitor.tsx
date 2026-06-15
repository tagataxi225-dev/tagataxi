import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, MapPin, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface DispatchOrder {
  id: string;
  type: 'transport' | 'delivery';
  status: string;
  pickup_location: string;
  delivery_location?: string;
  created_at: string;
  driver_assigned_at?: string;
  driver_id?: string;
  estimated_price?: number;
  priority?: string;
}

export const DispatchMonitor: React.FC = () => {
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    assigned: 0,
    completed: 0,
    avgAssignmentTime: 0
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Charger les commandes de transport récentes
      const { data: transportOrders, error: transportError } = await supabase
        .from('transport_bookings')
        .select('id, status, pickup_location, created_at, driver_assigned_at, driver_id, estimated_price, pickup_coordinates')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (transportError) throw transportError;

      // Charger les commandes de livraison récentes
      const { data: deliveryOrders, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select('id, status, pickup_location, delivery_location, created_at, driver_assigned_at, driver_id, estimated_price, pickup_coordinates')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (deliveryError) throw deliveryError;

      // Combiner et formatter les commandes
      const combinedOrders: DispatchOrder[] = [
        ...(transportOrders || []).map(order => ({
          id: order.id,
          type: 'transport' as const,
          status: order.status || 'pending',
          pickup_location: order.pickup_location || 'Lieu de prise en charge',
          delivery_location: 'Destination',
          created_at: order.created_at,
          driver_assigned_at: order.driver_assigned_at || undefined,
          driver_id: order.driver_id || undefined,
          estimated_price: order.estimated_price || undefined
        })),
        ...(deliveryOrders || []).map(order => ({
          id: order.id,
          type: 'delivery' as const,
          status: order.status || 'pending',
          pickup_location: order.pickup_location || 'Lieu de prise en charge',
          delivery_location: order.delivery_location || 'Lieu de livraison',
          created_at: order.created_at,
          driver_assigned_at: order.driver_assigned_at || undefined,
          driver_id: order.driver_id || undefined,
          estimated_price: order.estimated_price || undefined
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(combinedOrders);

      // Calculer les statistiques
      const pending = combinedOrders.filter(o => o.status === 'pending').length;
      const assigned = combinedOrders.filter(o => o.status === 'driver_assigned').length;
      const completed = combinedOrders.filter(o => o.status === 'completed').length;

      // Calculer le temps moyen d'assignation
      const assignedOrders = combinedOrders.filter(o => o.driver_assigned_at);
      const avgTime = assignedOrders.length > 0 
        ? assignedOrders.reduce((acc, order) => {
            const assignmentTime = new Date(order.driver_assigned_at!).getTime() - new Date(order.created_at).getTime();
            return acc + (assignmentTime / 1000 / 60); // en minutes
          }, 0) / assignedOrders.length
        : 0;

      setStats({
        pending,
        assigned,
        completed,
        avgAssignmentTime: Math.round(avgTime * 10) / 10
      });

    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualDispatch = async (orderId: string, type: 'transport' | 'delivery') => {
    try {
      // Récupérer les détails de la commande
      const table = type === 'transport' ? 'transport_bookings' : 'delivery_orders';
      const { data: orderData, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !orderData) {
        toast.error('Commande introuvable');
        return;
      }

      // Déclencher le dispatch manuel
      const coordinates = orderData.pickup_coordinates as any;
      const { error } = await supabase.functions.invoke('auto-dispatch-system', {
        body: {
          [type === 'transport' ? 'booking_id' : 'order_id']: orderId,
          type,
          pickup_lat: coordinates?.lat || -4.3217,
          pickup_lng: coordinates?.lng || 15.3069,
          city: 'Kinshasa',
          priority: 'urgent'
        }
      });

      if (error) {
        toast.error('Erreur lors du dispatch manuel');
        console.error('Erreur dispatch:', error);
      } else {
        toast.success('Dispatch manuel déclenché');
        // Recharger les données après 2 secondes
        setTimeout(loadOrders, 2000);
      }

    } catch (error) {
      console.error('Erreur dispatch manuel:', error);
      toast.error('Erreur lors du dispatch manuel');
    }
  };

  useEffect(() => {
    loadOrders();
    
    // Rechargement automatique toutes les 30 secondes
    const interval = setInterval(loadOrders, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><AlertCircle className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'driver_assigned':
        return <Badge variant="outline" className="text-blue-600"><User className="w-3 h-3 mr-1" />Assigné</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'transport' 
      ? <Badge variant="secondary">🚗 Transport</Badge>
      : <Badge variant="secondary">📦 Livraison</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assignées</p>
                <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
              </div>
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temps moyen</p>
                <p className="text-2xl font-bold">{stats.avgAssignmentTime}min</p>
              </div>
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes récentes</CardTitle>
          <CardDescription>
            Supervision en temps réel du système de dispatch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune commande trouvée dans les dernières 24h
              </p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(order.type)}
                      {getStatusBadge(order.status)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span>{order.pickup_location}</span>
                      </div>
                      {order.delivery_location && (
                        <>
                          <span>→</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <span>{order.delivery_location}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {order.estimated_price && (
                      <p className="text-sm font-medium">
                        Prix estimé: {order.estimated_price.toLocaleString()} CDF
                      </p>
                    )}

                    {order.driver_assigned_at && (
                      <p className="text-xs text-muted-foreground">
                        Assigné le {new Date(order.driver_assigned_at).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerManualDispatch(order.id, order.type)}
                      >
                        Dispatch manuel
                      </Button>
                    )}
                    
                    <Button size="sm" variant="ghost" onClick={loadOrders}>
                      Actualiser
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};