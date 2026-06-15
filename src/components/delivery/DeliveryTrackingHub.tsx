import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Package, Check, AlertCircle, Loader2 } from 'lucide-react';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import DeliveryTracking from './DeliveryTracking';
import { useEnhancedDeliveryTracking } from '@/hooks/useEnhancedDeliveryTracking';
import DeliveryPaymentModal from '@/components/payment/DeliveryPaymentModal';
import { DeliveryDriverChatModal } from './DeliveryDriverChatModal';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const CANCEL_REASONS = [
  { id: 'changed_mind', label: "J'ai changé d'avis" },
  { id: 'wrong_address', label: "Mauvaise adresse" },
  { id: 'found_alternative', label: "J'ai trouvé une autre solution" },
  { id: 'too_expensive', label: "Prix trop élevé" },
  { id: 'driver_delayed', label: "Délai d'attente trop long" },
  { id: 'other', label: "Autre raison" }
];

interface DeliveryTrackingHubProps {
  orderId: string;
  onBack?: () => void;
}

const getDeliveryTypeLabel = (type: string): string => {
  switch (type?.toLowerCase()) {
    case 'flash': return 'Flash';
    case 'maxicharge': return 'Maxicharge';
    default: return 'Flex';
  }
};

export default function DeliveryTrackingHub({ orderId, onBack }: DeliveryTrackingHubProps) {
  const [showChat, setShowChat] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    order,
    estimatedArrival,
    driverProfile,
    driverLocation,
    currency,
    contactDriver,
    loading
  } = useEnhancedDeliveryTracking(orderId);

  useEffect(() => {
    if (order?.status === 'delivered') setShowPayment(true);
  }, [order?.status]);

  const handleConfirmCancel = async () => {
    if (!order || !user || !cancelReason) return;

    const reason = cancelReason === 'other'
      ? customReason.trim()
      : CANCEL_REASONS.find(r => r.id === cancelReason)?.label || 'Annulé par le client';

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason
        })
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: "Commande annulée", description: "Votre livraison a été annulée avec succès" });
      setShowCancelSheet(false);
      setCancelReason('');
      setCustomReason('');
      onBack?.();
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast({ title: "Erreur", description: "Impossible d'annuler cette commande", variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const getPickupCoords = () => {
    const coords = order?.pickup_coordinates;
    if (!coords) return undefined;
    if (typeof coords === 'object' && coords.lat !== undefined && coords.lng !== undefined) {
      return { lat: Number(coords.lat), lng: Number(coords.lng) };
    }
    try {
      if (typeof coords === 'string') {
        const p = JSON.parse(coords);
        if (p.lat && p.lng) return { lat: Number(p.lat), lng: Number(p.lng) };
      }
    } catch {}
    return undefined;
  };

  const getDestinationCoords = () => {
    const coords = order?.delivery_coordinates;
    if (!coords) return undefined;
    if (typeof coords === 'object' && coords.lat !== undefined && coords.lng !== undefined) {
      return { lat: Number(coords.lat), lng: Number(coords.lng) };
    }
    try {
      if (typeof coords === 'string') {
        const p = JSON.parse(coords);
        if (p.lat && p.lng) return { lat: Number(p.lat), lng: Number(p.lng) };
      }
    } catch {}
    return undefined;
  };

  const getDriverLocationForMap = () => {
    if (driverLocation?.latitude && driverLocation?.longitude) {
      return { lat: driverLocation.latitude, lng: driverLocation.longitude, heading: driverLocation.heading || null };
    }
    return undefined;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold">Commande introuvable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cette commande n'existe pas ou vous n'y avez pas accès
            </p>
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm">Retour</Button>
          )}
        </div>
      </div>
    );
  }

  const mapDeliveryStatus = (s: string): 'searching' | 'driver_assigned' | 'picked_up' | 'in_transit' | 'delivered' => {
    if (s === 'driver_assigned') return 'driver_assigned';
    if (s === 'picked_up')       return 'picked_up';
    if (s === 'in_transit')      return 'in_transit';
    if (s === 'delivered')       return 'delivered';
    return 'searching';
  };

  const etaMinutes = estimatedArrival ? (parseInt(estimatedArrival) || null) : null;

  return (
    <>
      <DeliveryTracking
        orderId={orderId}
        status={mapDeliveryStatus(order.status)}
        etaMinutes={etaMinutes}
        pickupLabel={order.pickup_location || ''}
        destinationLabel={order.delivery_location || ''}
        fareAmount={order.actual_price || order.estimated_price || 0}
        currency={(currency || 'CDF') as 'CDF' | 'XOF'}
        serviceLabel={getDeliveryTypeLabel(order.delivery_type || 'flex')}
        packageLabel={order.package_type || 'Standard'}
        driver={driverProfile ? {
          name: driverProfile.display_name,
          phone: driverProfile.phone_number || undefined,
          photoUrl: driverProfile.profile_photo_url || undefined,
          vehiclePlate: driverProfile.vehicle_plate || undefined,
        } : undefined}
        recipientName={order.recipient_name || ''}
        recipientPhone={order.recipient_phone || ''}
        senderPhone={order.sender_phone || ''}
        onBack={onBack || (() => {})}
        onCallDriver={contactDriver}
        onMessageDriver={() => setShowChat(true)}
        onCallRecipient={() => { if (order.recipient_phone) window.open(`tel:${order.recipient_phone}`); }}
        onCancel={() => setShowCancelSheet(true)}
        mapSlot={
          <GoogleMapsKwenda
            pickup={getPickupCoords()}
            destination={getDestinationCoords()}
            driverLocation={getDriverLocationForMap()}
            showRoute={Boolean(getPickupCoords() && getDestinationCoords())}
            height="100%"
            deliveryMode={order.delivery_type || 'flex'}
          />
        }
      />

      {order && (
        <DeliveryPaymentModal
          open={showPayment}
          onOpenChange={setShowPayment}
          orderId={orderId}
          amount={order.actual_price || order.estimated_price || 0}
          currency={currency}
          pickup={order.pickup_location}
          destination={order.delivery_location}
          onPaymentComplete={() => { setShowPayment(false); onBack?.(); }}
        />
      )}

      {showChat && driverProfile && order && (
        <DeliveryDriverChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          driverData={{
            driver_id: driverProfile.id,
            driver_profile: {
              display_name: driverProfile.display_name,
              phone_number: driverProfile.phone_number || '',
              rating_average: driverProfile.rating_average || 0,
              vehicle_type: driverProfile.vehicle_type || 'N/A',
              vehicle_plate: driverProfile.vehicle_plate || 'N/A'
            },
            distance: 0,
            estimated_arrival: etaMinutes || 15
          }}
          orderId={orderId}
          deliveryPrice={order.estimated_price || order.actual_price || 0}
        />
      )}

      <Sheet open={showCancelSheet} onOpenChange={setShowCancelSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Annuler la livraison
            </SheetTitle>
            <SheetDescription>
              Veuillez indiquer le motif de l'annulation
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-4">
            {CANCEL_REASONS.map((reason) => (
              <button
                key={reason.id}
                onClick={() => setCancelReason(reason.id)}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all",
                  cancelReason === reason.id
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-border/50 hover:border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    cancelReason === reason.id
                      ? "border-destructive bg-destructive"
                      : "border-muted-foreground/30"
                  )}>
                    {cancelReason === reason.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-medium text-sm">{reason.label}</span>
                </div>
              </button>
            ))}

            <AnimatePresence>
              {cancelReason === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Input
                    placeholder="Précisez votre raison..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="mt-2 rounded-xl h-12"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <SheetFooter className="flex gap-3 pt-4 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => { setShowCancelSheet(false); setCancelReason(''); setCustomReason(''); }}
              className="flex-1 h-12 rounded-xl"
            >
              Non, garder
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!cancelReason || (cancelReason === 'other' && !customReason.trim()) || isCancelling}
              className="flex-1 h-12 rounded-xl"
            >
              {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmer l'annulation
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
