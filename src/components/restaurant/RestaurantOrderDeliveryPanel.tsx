/**
 * Panel de livraison moderne pour restaurants
 * Design compact soft-modern avec options côte à côte
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRestaurantDelivery, DeliveryAssignment } from '@/hooks/useRestaurantDelivery';
import { useDynamicDeliveryPricing } from '@/hooks/useDynamicDeliveryPricing';
import { RestaurantDeliveryDrawer } from './RestaurantDeliveryDrawer';
import { Truck, Phone, User, MapPin, Clock, CheckCircle2, Loader2, Bike, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RestaurantOrderDeliveryPanelProps {
  orderId: string;
  orderStatus: string;
  restaurantAddress: string;
  deliveryAddress: string;
  deliveryCoordinates?: { lat: number; lng: number };
  restaurantProfile?: {
    restaurant_name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    phone_number?: string;
  };
  deliveryPhone?: string;
  orderNumber?: string;
  onStatusChange?: () => void;
}

// Detect raw coordinates in address string
const isRawCoordinates = (address?: string): boolean => {
  if (!address) return false;
  return /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(address.trim());
};

export function RestaurantOrderDeliveryPanel({
  orderId,
  orderStatus,
  restaurantAddress,
  deliveryAddress,
  deliveryCoordinates,
  restaurantProfile,
  deliveryPhone,
  orderNumber,
  onStatusChange
}: RestaurantOrderDeliveryPanelProps) {
  const { 
    loading, 
    assignment,
    requestDelivery, 
    startSelfDelivery, 
    completeDelivery,
    getDeliveryStatus 
  } = useRestaurantDelivery();
  
  const { calculatePrice, formatPrice } = useDynamicDeliveryPricing();
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryAssignment | null>(null);
  const [showDeliveryDrawer, setShowDeliveryDrawer] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [showSelfDeliveryConfirm, setShowSelfDeliveryConfirm] = useState(false);

  useEffect(() => {
    if (orderId && ['ready', 'driver_assigned', 'picked_up'].includes(orderStatus)) {
      loadDeliveryInfo();
    }
  }, [orderId, orderStatus]);

  // Calculate estimated price
  useEffect(() => {
    const estimate = async () => {
      if (restaurantProfile?.latitude && restaurantProfile?.longitude && deliveryCoordinates) {
        const R = 6371;
        const dLat = (deliveryCoordinates.lat - restaurantProfile.latitude) * Math.PI / 180;
        const dLon = (deliveryCoordinates.lng - restaurantProfile.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(restaurantProfile.latitude * Math.PI / 180) * Math.cos(deliveryCoordinates.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        const result = await calculatePrice('flash', distance);
        setEstimatedPrice(result?.calculated_price || 7500);
      } else {
        setEstimatedPrice(7500);
      }
    };
    estimate();
  }, [restaurantProfile, deliveryCoordinates]);

  const loadDeliveryInfo = async () => {
    const info = await getDeliveryStatus(orderId);
    if (info) setDeliveryInfo(info as any);
  };

  const handleDeliveryRequested = async (deliveryFee: number, serviceType: string) => {
    const result = await requestDelivery(orderId, serviceType as 'flash' | 'flex' | 'maxicharge');
    if (result.success) {
      await loadDeliveryInfo();
      onStatusChange?.();
    }
  };

  const handleSelfDeliveryConfirmed = async () => {
    setShowSelfDeliveryConfirm(false);
    const result = await startSelfDelivery(orderId);
    if (result.success) onStatusChange?.();
  };

  const handleCompleteDelivery = async () => {
    const result = await completeDelivery(orderId);
    if (result.success) onStatusChange?.();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      searching: { label: 'Recherche livreur', variant: 'secondary' },
      driver_found: { label: 'Livreur trouvé', variant: 'default' },
      driver_accepted: { label: 'Accepté', variant: 'default' },
      picked_up: { label: 'En cours', variant: 'default' },
      in_transit: { label: 'En route', variant: 'default' },
      delivered: { label: 'Livré', variant: 'default' },
      cancelled: { label: 'Annulé', variant: 'destructive' }
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Format address display
  const renderAddress = () => {
    const raw = isRawCoordinates(deliveryAddress);
    const query = deliveryCoordinates 
      ? `${deliveryCoordinates.lat},${deliveryCoordinates.lng}` 
      : encodeURIComponent(deliveryAddress || '');
    
    return (
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
        onClick={(e) => e.stopPropagation()}
      >
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{raw ? 'Position GPS du client' : deliveryAddress}</span>
        <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" />
      </a>
    );
  };

  // ── Driver assigned / tracking ──
  if (deliveryInfo && orderStatus !== 'delivered') {
    return (
      <Card className="bg-muted/30 border-border/40">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Truck className="h-3.5 w-3.5 text-primary" />
              Suivi livraison
            </div>
            {getStatusBadge(deliveryInfo.assignment_status)}
          </div>

          {deliveryInfo.driver && (
            <div className="flex items-center gap-2 bg-background/60 rounded-lg p-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{deliveryInfo.driver.display_name}</p>
                <p className="text-xs text-muted-foreground">{deliveryInfo.driver.vehicle_type}</p>
              </div>
              {deliveryInfo.driver.phone_number && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                  <a href={`tel:${deliveryInfo.driver.phone_number}`}>
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          )}

          {deliveryInfo.actual_pickup_time && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              Récupérée à {new Date(deliveryInfo.actual_pickup_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Self-delivery in progress ──
  if (orderStatus === 'in_transit' && !deliveryInfo) {
    return (
      <Card className="bg-muted/30 border-border/40">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bike className="h-3.5 w-3.5 text-emerald-500" />
            Auto-livraison en cours
          </div>
          <Button 
            onClick={handleCompleteDelivery}
            disabled={loading}
            size="sm"
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Confirmation...</>
            ) : (
              <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Marquer comme livrée</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Delivered ──
  if (orderStatus === 'delivered') {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm py-1">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="font-medium">Livraison terminée</span>
      </div>
    );
  }

  // ── Main: Choose delivery method (confirmed / preparing / ready) ──
  return (
    <>
      <Card className="bg-muted/30 border-border/40">
        <CardContent className="p-3 space-y-3">
          {/* Header with address */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
              Livraison
            </span>
            {renderAddress()}
          </div>

          {/* Two options side by side */}
          <div className="grid grid-cols-2 gap-2">
            {/* Tembea */}
            <button
              onClick={() => setShowDeliveryDrawer(true)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/60 bg-background/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
            >
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold">Livreur TAGA</span>
              <span className="text-[10px] text-muted-foreground">
                ~{estimatedPrice > 0 ? formatPrice(estimatedPrice) : '7 500 CDF'}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Express</Badge>
            </button>

            {/* Self */}
            <button
              onClick={() => setShowSelfDeliveryConfirm(true)}
              disabled={loading}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/60 bg-background/60 hover:border-emerald-400/40 hover:bg-emerald-500/5 transition-all text-center disabled:opacity-50"
            >
              <Bike className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-semibold">Je livre moi-même</span>
              <span className="text-[10px] text-muted-foreground">Livraison propre</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-0">Gratuit</Badge>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tembea Delivery Drawer */}
      <RestaurantDeliveryDrawer
        isOpen={showDeliveryDrawer}
        onClose={() => setShowDeliveryDrawer(false)}
        order={{
          id: orderId,
          order_number: orderNumber,
          delivery_address: deliveryAddress,
          delivery_coordinates: deliveryCoordinates,
          delivery_phone: deliveryPhone
        }}
        restaurantProfile={restaurantProfile}
        onDeliveryRequested={handleDeliveryRequested}
      />

      {/* Self-delivery confirmation */}
      <AlertDialog open={showSelfDeliveryConfirm} onOpenChange={setShowSelfDeliveryConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Livraison personnelle</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez livrer cette commande vous-même. Le statut passera à "En livraison".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleSelfDeliveryConfirmed} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
