import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Package, Truck, CheckCircle2, XCircle, Shield, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';
import { DownloadReceiptButton } from './DownloadReceiptButton';
import { FoodDeliveryConfirmation } from './FoodDeliveryConfirmation';
import { FoodDeliveryFeeApprovalDialog } from './FoodDeliveryFeeApprovalDialog';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/components/chat/ChatProvider';
interface FoodOrderTrackingProps {
  orderId: string;
  onBack: () => void;
}

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  delivery_payment_status?: string;
  customer_id?: string;
  total_amount: number;
  created_at: string;
  estimated_delivery_time?: number;
  delivery_fee?: number;
  delivery_address?: string;
  driver_id?: string;
  driver?: {
    display_name: string;
    phone_number: string;
    profile_photo_url?: string;
  };
  driver_location?: { lat: number; lng: number; heading?: number | null; updated_at?: string };
  restaurant_profiles: {
    restaurant_name: string;
    phone_number: string;
  };
}

const STATUS_CONFIG = {
  pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-500' },
  confirmed: { label: 'Confirmée', icon: CheckCircle2, color: 'bg-blue-500' },
  preparing: { label: 'En préparation', icon: Package, color: 'bg-orange-500' },
  ready: { label: 'Prêt', icon: CheckCircle2, color: 'bg-green-500' },
  pending_delivery_approval: { label: 'Approbation livraison', icon: Clock, color: 'bg-amber-500' },
  driver_assigned: { label: 'Livreur assigné', icon: Truck, color: 'bg-indigo-500' },
  picked_up: { label: 'Récupérée', icon: Truck, color: 'bg-purple-500' },
  in_transit: { label: 'En livraison', icon: Truck, color: 'bg-purple-600' },
  delivering: { label: 'En livraison', icon: Truck, color: 'bg-purple-600' },
  delivered: { label: 'Livré', icon: CheckCircle2, color: 'bg-green-600' },
  cancelled: { label: 'Annulée', icon: XCircle, color: 'bg-red-500' },
};

export const FoodOrderTracking = ({ orderId, onBack }: FoodOrderTrackingProps) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeliveryApproval, setShowDeliveryApproval] = useState(false);
  const { user } = useAuth();
  const { openChat } = useChat();

  // Ouvrir le dialog d'approbation des frais quand delivery_payment_status === 'pending'
  useEffect(() => {
    if (order?.delivery_payment_status === 'pending' && order?.customer_id === user?.id) {
      setShowDeliveryApproval(true);
    }
  }, [order?.delivery_payment_status, order?.customer_id, user?.id]);

  const refetchOrder = async () => {
    const { data, error } = await supabase
      .from('food_orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        created_at,
        estimated_delivery_time,
        delivery_fee,
        delivery_address,
        driver_id,
        restaurant_profiles (
          restaurant_name,
          phone_number
        )
      `)
      .eq('id', orderId)
      .single();

    if (!error && data) {
      let orderWithDriver = data as any;
      if (data.driver_id) {
        const { data: driverData } = await supabase
          .from('chauffeurs')
          .select('display_name, phone_number, profile_photo_url')
          .eq('user_id', data.driver_id)
          .single();
        if (driverData) {
          orderWithDriver.driver = driverData;
        }
        const { data: driverLoc } = await supabase.rpc('get_driver_location_for_order', {
          p_order_id: orderId
        });
        if (driverLoc?.[0]) {
          orderWithDriver.driver_location = { lat: driverLoc[0].latitude, lng: driverLoc[0].longitude, heading: driverLoc[0].heading, updated_at: driverLoc[0].updated_at };
        }
      }
      setOrder(orderWithDriver);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('food_orders')
        .select(`
          id,
          order_number,
          status,
          delivery_payment_status,
          customer_id,
          total_amount,
          created_at,
          estimated_delivery_time,
          delivery_fee,
          delivery_address,
          driver_id,
          restaurant_profiles (
            restaurant_name,
            phone_number
          )
        `)
        .eq('id', orderId)
        .single();

      if (!error && data) {
        let orderWithDriver = data as any;
        if (data.driver_id) {
          const { data: driverData } = await supabase
            .from('chauffeurs')
            .select('display_name, phone_number, profile_photo_url')
            .eq('user_id', data.driver_id)
            .single();
          if (driverData) {
            orderWithDriver.driver = driverData;
          }
          const { data: driverLoc } = await supabase.rpc('get_driver_location_for_order', {
            p_order_id: orderId
          });
          if (driverLoc?.[0]) {
            orderWithDriver.driver_location = { lat: driverLoc[0].latitude, lng: driverLoc[0].longitude, heading: driverLoc[0].heading, updated_at: driverLoc[0].updated_at };
          }
        }
        setOrder(orderWithDriver);
      }
      setLoading(false);
    };

    fetchOrder();

    // Real-time subscription
    const channel = supabase
      .channel(`food-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'food_orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Realtime driver location subscription
  useEffect(() => {
    if (!order?.driver_id) return;
    const channel = supabase
      .channel(`food-driver-${order.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${order.driver_id}`,
        },
        (payload) => {
          const d = payload.new as any;
          setOrder(prev => prev ? { ...prev, driver_location: { lat: d.latitude, lng: d.longitude, heading: d.heading, updated_at: d.updated_at } } : prev);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [order?.driver_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-muted-foreground mb-4">Commande introuvable</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Suivi de commande</h1>
            <p className="text-sm opacity-90">#{order.order_number}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center flex-col gap-4">
              <div className={`${statusConfig.color} rounded-full p-4`}>
                <StatusIcon className="h-12 w-12 text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{statusConfig.label}</h2>
                {order.estimated_delivery_time && order.status !== 'delivered' && (
                  <p className="text-muted-foreground mt-2">
                    Temps estimé: {order.estimated_delivery_time} minutes
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Info */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{order.restaurant_profiles.restaurant_name}</p>
            <p className="text-sm text-muted-foreground">{order.restaurant_profiles.phone_number}</p>
          </CardContent>
        </Card>

        {/* Driver Info - affiché quand un livreur est assigné */}
        {order.driver && (
          <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Truck className="h-5 w-5" />
                Votre livreur
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              {order.driver.profile_photo_url ? (
                <img 
                  src={order.driver.profile_photo_url} 
                  alt={order.driver.display_name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-foreground">{order.driver.display_name}</p>
                <p className="text-sm text-muted-foreground">{order.driver.phone_number}</p>
              </div>
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => window.location.href = `tel:${order.driver?.phone_number}`}
              >
                Appeler
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-900"
                onClick={() => openChat({
                  contextType: 'delivery',
                  participantId: order.driver_id || '',
                  title: `Commande #${order.order_number}`
                })}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Contacter
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Driver Map */}
        {order?.driver_location && ['driver_assigned', 'picked_up', 'in_transit', 'delivering'].includes(order.status) && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <GoogleMapsKwenda
                driverLocation={order.driver_location}
                center={order.driver_location}
                height="250px"
                zoom={15}
              />
            </CardContent>
          </Card>
        )}

        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Détails de la commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Numéro</span>
              <span className="font-semibold">#{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-semibold">
                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-bold">Total</span>
              <span className="font-bold text-orange-600">
                {formatCurrency(order.total_amount, getCurrencyByCity(order.delivery_address || ''))}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Escrow Info + Confirm Button */}
        {order.status === 'delivered' && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Commande livrée - Confirmation requise
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Confirmez la réception pour libérer le paiement au restaurant
                  </p>
                </div>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => setShowConfirmation(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmer la réception
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Download Receipt */}
        <Card>
          <CardContent className="pt-6">
            <DownloadReceiptButton 
              orderId={orderId} 
              variant="default"
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(STATUS_CONFIG).map(([status, config], index) => {
                const isActive = order.status === status;
                const Icon = config.icon;
                const statusOrder = ['pending', 'confirmed', 'pending_delivery_approval', 'preparing', 'ready', 'driver_assigned', 'picked_up', 'delivering', 'delivered'];
                const currentIndex = statusOrder.indexOf(order.status);
                const stepIndex = statusOrder.indexOf(status);
                const isCompleted = stepIndex <= currentIndex;

                return (
                  <div key={status} className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        isCompleted ? config.color : 'bg-muted'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isCompleted ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isActive ? 'text-orange-600' : ''}`}>
                        {config.label}
                      </p>
                    </div>
                    {isActive && (
                      <Badge className={config.color + ' text-white'}>En cours</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog approbation frais de livraison */}
      {order && (
        <FoodDeliveryFeeApprovalDialog
          order={{
            id: order.id,
            status: 'pending_delivery_approval',
            customer_id: order.customer_id || '',
            total_amount: order.total_amount,
            delivery_fee: order.delivery_fee || 0,
            restaurant: { name: order.restaurant_profiles.restaurant_name }
          }}
          open={showDeliveryApproval}
          onOpenChange={(open) => setShowDeliveryApproval(open)}
          onApproved={() => {
            setShowDeliveryApproval(false);
            refetchOrder();
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <FoodDeliveryConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        orderId={orderId}
        orderNumber={order.order_number}
        restaurantName={order.restaurant_profiles.restaurant_name}
        totalAmount={order.total_amount}
        onConfirmed={() => {
          refetchOrder();
          setShowConfirmation(false);
        }}
      />
    </div>
  );
};
