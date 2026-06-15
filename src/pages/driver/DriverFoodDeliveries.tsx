import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  UtensilsCrossed, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Package,
  Loader2,
  Clock,
  DollarSign
} from 'lucide-react';

interface FoodDelivery {
  id: string;
  food_order_id: string;
  assignment_status: string;
  pickup_location: string;
  delivery_location: string;
  delivery_fee: number;
  driver_earnings: number;
  estimated_pickup_time: string;
  restaurant_notes: string | null;
  restaurant: {
    restaurant_name: string;
    phone_number: string;
  };
  order: {
    order_number: string;
    delivery_phone: string | null;
    special_instructions: string | null;
    customer: {
      display_name: string | null;
      phone_number: string | null;
    } | null;
  };
}

export default function DriverFoodDeliveries() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<FoodDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDeliveries();
      subscribeToDeliveries();
    }
  }, [user]);

  const loadDeliveries = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('food_delivery_assignments')
        .select(`
          *,
          restaurant:restaurant_profiles!food_delivery_assignments_restaurant_id_fkey(
            restaurant_name,
            phone_number
          ),
          order:food_orders!food_delivery_assignments_food_order_id_fkey(
            order_number,
            delivery_phone,
            special_instructions,
            customer:clients!food_orders_customer_id_fkey(
              display_name,
              phone_number
            )
          )
        `)
        .eq('driver_id', user?.id)
        .in('assignment_status', ['driver_found', 'driver_accepted', 'picked_up', 'in_transit'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries((data || []) as any);
    } catch (error: any) {
      console.error('Error loading deliveries:', error);
      toast.error('Erreur de chargement', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToDeliveries = () => {
    const channel = supabase
      .channel('driver-food-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_delivery_assignments',
          filter: `driver_id=eq.${user?.id}`
        },
        () => {
          loadDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    try {
      const { error } = await (supabase as any)
        .from('food_delivery_assignments')
        .update({
          assignment_status: 'driver_accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast.success('✅ Livraison acceptée', {
        description: 'Direction le restaurant !'
      });
      
      await loadDeliveries();
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePickup = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    try {
      const { error } = await (supabase as any)
        .from('food_delivery_assignments')
        .update({
          assignment_status: 'picked_up',
          actual_pickup_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast.success('📦 Commande récupérée', {
        description: 'Direction le client !'
      });
      
      await loadDeliveries();
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    try {
      const { error } = await (supabase as any)
        .from('food_delivery_assignments')
        .update({
          assignment_status: 'delivered',
          actual_delivery_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast.success('✅ Livraison terminée', {
        description: 'Bien joué ! Votre gain a été crédité'
      });
      
      await loadDeliveries();
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openNavigation = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Aucune livraison Food</p>
          <p className="text-sm text-muted-foreground">Les nouvelles demandes apparaîtront ici</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Livraisons Food</h2>
        <Badge variant="secondary">{deliveries.length} active(s)</Badge>
      </div>

      <ScrollArea className="h-[calc(100dvh-200px)]">
        <div className="space-y-4 pr-4">
          {deliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5" />
                      {delivery.restaurant.restaurant_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Commande #{delivery.order.order_number}
                    </p>
                  </div>
                  <Badge variant={
                    delivery.assignment_status === 'driver_found' ? 'secondary' :
                    delivery.assignment_status === 'picked_up' ? 'default' : 'outline'
                  }>
                    {delivery.assignment_status === 'driver_found' && 'Nouvelle'}
                    {delivery.assignment_status === 'driver_accepted' && 'Acceptée'}
                    {delivery.assignment_status === 'picked_up' && 'En cours'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Gains */}
                <div className="bg-primary/5 p-3 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium">Votre gain</span>
                  <span className="text-lg font-bold flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {delivery.driver_earnings.toLocaleString()} CDF
                  </span>
                </div>

                {/* Timing */}
                {delivery.estimated_pickup_time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Récupération estimée: {new Date(delivery.estimated_pickup_time).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}

                <Separator />

                {/* Itinéraire */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Récupération</p>
                      <p className="text-sm text-muted-foreground break-words">{delivery.pickup_location}</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 text-xs"
                        asChild
                      >
                        <a href={`tel:${delivery.restaurant.phone_number}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          {delivery.restaurant.phone_number}
                        </a>
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openNavigation(delivery.pickup_location)}
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Livraison</p>
                      {delivery.order.customer?.display_name && (
                        <p className="text-sm font-semibold">{delivery.order.customer.display_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground break-words">{delivery.delivery_location}</p>
                      {(delivery.order.customer?.phone_number || delivery.order.delivery_phone) ? (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-xs"
                          asChild
                        >
                          <a href={`tel:${delivery.order.customer?.phone_number || delivery.order.delivery_phone}`}>
                            <Phone className="h-3 w-3 mr-1" />
                            {delivery.order.customer?.phone_number || delivery.order.delivery_phone}
                          </a>
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground">Téléphone non renseigné</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openNavigation(delivery.delivery_location)}
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                {(delivery.restaurant_notes || delivery.order.special_instructions) && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      {delivery.restaurant_notes && (
                        <div>
                          <p className="font-medium">Note du restaurant:</p>
                          <p className="text-muted-foreground">{delivery.restaurant_notes}</p>
                        </div>
                      )}
                      {delivery.order.special_instructions && (
                        <div>
                          <p className="font-medium">Instructions client:</p>
                          <p className="text-muted-foreground">{delivery.order.special_instructions}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  {delivery.assignment_status === 'driver_found' && (
                    <Button 
                      onClick={() => handleAcceptDelivery(delivery.id)}
                      disabled={actionLoading === delivery.id}
                      className="w-full"
                      size="lg"
                    >
                      {actionLoading === delivery.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Acceptation...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Accepter la livraison
                        </>
                      )}
                    </Button>
                  )}

                  {delivery.assignment_status === 'driver_accepted' && (
                    <Button 
                      onClick={() => handlePickup(delivery.id)}
                      disabled={actionLoading === delivery.id}
                      className="w-full"
                      size="lg"
                    >
                      {actionLoading === delivery.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirmation...
                        </>
                      ) : (
                        <>
                          <Package className="mr-2 h-4 w-4" />
                          J'ai récupéré la commande
                        </>
                      )}
                    </Button>
                  )}

                  {delivery.assignment_status === 'picked_up' && (
                    <Button 
                      onClick={() => handleComplete(delivery.id)}
                      disabled={actionLoading === delivery.id}
                      className="w-full"
                      size="lg"
                    >
                      {actionLoading === delivery.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Finalisation...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Livraison terminée
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}