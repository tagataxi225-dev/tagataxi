import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Package, Clock, Truck, Phone, Eye, Search, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { VendorOrderValidationPanel } from './VendorOrderValidationPanel';
import { formatCurrency } from '@/utils/formatCurrency';

interface VendorOrder {
  id: string;
  buyer_name: string;
  product_title: string;
  quantity: number;
  total_amount: number;
  delivery_method: string;
  delivery_address?: string;
  status: string;
  created_at: string;
  delivery_assignment?: {
    id: string;
    assignment_status: string;
    driver_name?: string;
    estimated_delivery_time?: string;
    tracking_info?: any;
  };
}

export const VendorDeliveryManager = () => {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { user } = useAuth();

  const loadOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          marketplace_products!inner(title),
          marketplace_delivery_assignments(
            id,
            assignment_status,
            estimated_delivery_time
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: VendorOrder[] = data?.map(order => ({
        id: order.id,
        buyer_name: 'Acheteur',
        product_title: order.marketplace_products?.title || 'Produit',
        quantity: order.quantity,
        total_amount: order.total_amount,
        delivery_method: order.delivery_method,
        delivery_address: order.delivery_address,
        status: order.status,
        created_at: order.created_at,
        delivery_assignment: order.marketplace_delivery_assignments?.[0] ? {
          id: order.marketplace_delivery_assignments[0].id,
          assignment_status: order.marketplace_delivery_assignments[0].assignment_status,
          driver_name: 'Livreur Tembea',
          estimated_delivery_time: order.marketplace_delivery_assignments[0].estimated_delivery_time
        } : undefined
      })) || [];

      setOrders(formattedOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryPreference = async (orderId: string, deliveryMethod: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({ delivery_method: deliveryMethod })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Préférence de livraison mise à jour');
      loadOrders();
    } catch (error: any) {
      console.error('Error updating delivery preference:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDriverSearch = (orderId: string) => {
    toast.info('Recherche de livreur automatique en cours...');
    // L'assignation automatique se fait via l'Edge Function delivery-dispatcher
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'confirmed': return 'bg-primary text-primary-foreground';
      case 'assigned': return 'bg-accent text-accent-foreground';
      case 'picked_up': return 'bg-info text-info-foreground';
      case 'delivered': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'delivery') return order.delivery_method !== 'pickup';
    if (filter === 'pickup') return order.delivery_method === 'pickup';
    if (filter === 'pending') return order.status === 'pending';
    return true;
  });

  useEffect(() => {
    loadOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const pendingValidation = orders.filter(o => o.status === 'pending');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Gestion des Livraisons</h2>
      </div>

      <Tabs defaultValue="validation" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="validation" className="relative">
            Validation commandes
            {pendingValidation.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingValidation.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders">
            Toutes les commandes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="mt-4">
          <VendorOrderValidationPanel 
            orders={orders} 
            onRefresh={loadOrders}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer les commandes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les commandes</SelectItem>
                <SelectItem value="delivery">Avec livraison</SelectItem>
                <SelectItem value="pickup">À récupérer</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium mb-1">Aucune commande</h3>
            <p className="text-sm text-muted-foreground">
              Les nouvelles commandes apparaîtront ici
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium">{order.product_title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Acheteur: {order.buyer_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()} à{' '}
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success">
                    {formatCurrency(order.total_amount, 'CDF')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Qté: {order.quantity}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
                <Badge variant="outline">
                  {order.delivery_method === 'pickup' ? 'À récupérer' : 'Livraison Tembea'}
                </Badge>
              </div>

              {order.delivery_address && (
                <div className="mb-3 p-2 bg-muted rounded text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                    <span>{order.delivery_address}</span>
                  </div>
                </div>
              )}

              {order.delivery_assignment && (
                <div className="mb-3 p-3 border border-accent rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">État de la livraison</span>
                    <Badge className={getStatusColor(order.delivery_assignment.assignment_status)}>
                      {order.delivery_assignment.assignment_status}
                    </Badge>
                  </div>
                  
                  {order.delivery_assignment.driver_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4" />
                      <span>Livreur: {order.delivery_assignment.driver_name}</span>
                    </div>
                  )}
                  
                  {order.delivery_assignment.estimated_delivery_time && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        Livraison prévue: {new Date(order.delivery_assignment.estimated_delivery_time).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {order.status === 'pending' && order.delivery_method === 'pickup' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateDeliveryPreference(order.id, 'kwenda_delivery')}
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    Activer livraison Tembea
                  </Button>
                )}
                
                {order.status === 'confirmed' && order.delivery_method !== 'pickup' && !order.delivery_assignment && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleDriverSearch(order.id)}
                  >
                    <Search className="h-4 w-4 mr-1" />
                    Rechercher livreur
                  </Button>
                )}
                
                {order.status === 'pending' && order.delivery_method !== 'pickup' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateDeliveryPreference(order.id, 'pickup')}
                  >
                    Changer en récupération
                  </Button>
                )}

                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Détails
                </Button>

                {order.buyer_name && (
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};