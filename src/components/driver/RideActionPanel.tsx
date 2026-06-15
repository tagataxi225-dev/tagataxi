/**
 * Panneau d'actions chauffeur — flow séquentiel course taxi
 * Phase 1 (driver_assigned | accepted) : carte vers pickup, Je suis arrivé
 * Phase 2 (pickup)                     : En attente du client, Démarrer
 * Phase 3 (in_progress)                : carte vers destination, Terminer
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  X,
  MapPin,
  ExternalLink,
  Phone,
  Star,
  Loader2,
  Clock,
  Navigation as NavigationIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { CancellationDialog } from '@/components/shared/CancellationDialog';
import StaticMapView from '@/components/transport/map/StaticMapView';

interface RideDetails {
  id: string;
  status: string;
  pickup_location: string;
  destination_location?: string;
  delivery_location?: string;
  destination?: string;
  pickup_coordinates: any;
  destination_coordinates?: any;
  delivery_coordinates?: any;
  estimated_price?: number;
  customer_phone?: string;
  sender_phone?: string;
  recipient_phone?: string;
  customer_name?: string;
  sender_name?: string;
  recipient_name?: string;
  distance_km?: number;
  rideType?: 'transport' | 'delivery';
  [key: string]: any;
}

export const RideActionPanel: React.FC = () => {
  const { user } = useAuth();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    loadActiveRide();

    const transportChannel = supabase
      .channel(`transport-driver-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'transport_bookings',
        filter: `driver_id=eq.${user.id}`
      }, (payload) => {
        const s = payload.new.status;
        if (['accepted', 'driver_assigned', 'driver_en_route', 'pickup', 'in_progress'].includes(s)) {
          setRide({ ...payload.new, rideType: 'transport' } as RideDetails);
        } else if (s === 'completed') {
          setRide(prev => prev ? { ...payload.new, rideType: 'transport' } as RideDetails : null);
        } else if (s === 'cancelled') {
          setRide(null);
        }
      })
      .subscribe();

    const deliveryChannel = supabase
      .channel(`delivery-driver-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_orders',
        filter: `driver_id=eq.${user.id}`
      }, (payload) => {
        const s = payload.new.status;
        if (['driver_assigned', 'pickup', 'picked_up', 'in_transit'].includes(s)) {
          setRide({ ...payload.new, rideType: 'delivery' } as RideDetails);
        } else if (s === 'delivered' || s === 'cancelled') {
          setRide(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(transportChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [user?.id]);

  const loadActiveRide = async () => {
    if (!user?.id) return;

    const { data: transportData } = await supabase
      .from('transport_bookings')
      .select('*')
      .eq('driver_id', user.id)
      .in('status', ['accepted', 'driver_assigned', 'driver_en_route', 'pickup', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (transportData) {
      setRide({ ...transportData, rideType: 'transport' } as RideDetails);
      return;
    }

    const { data: deliveryData } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('driver_id', user.id)
      .in('status', ['driver_assigned', 'pickup', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (deliveryData) {
      setRide({ ...deliveryData, rideType: 'delivery' } as RideDetails);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!ride?.id || !ride.rideType) return;

    setLoading(true);
    const table = ride.rideType === 'transport' ? 'transport_bookings' : 'delivery_orders';

    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'pickup') {
      updates.driver_arrived_at = new Date().toISOString();
    } else if (newStatus === 'in_progress' || newStatus === 'picked_up') {
      updates.trip_started_at = new Date().toISOString();
    } else if (newStatus === 'completed' || newStatus === 'delivered') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase.from(table).update(updates).eq('id', ride.id);
    setLoading(false);

    if (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      toast.error('Erreur lors de la mise à jour');
      return;
    }

    if (newStatus === 'pickup') {
      toast.success('✅ Arrivée confirmée — en attente du client');
    } else if (newStatus === 'in_progress') {
      toast.success('🚗 Course démarrée !');
    } else if (newStatus === 'completed' || newStatus === 'delivered') {
      toast.success('🎉 Course terminée !');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setRide(prev => prev ? { ...prev, status: newStatus } : null);
    }

    loadActiveRide();
  };

  // Accepter = vérification abonnement/wallet puis passer en phase pickup
  const handleAccept = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: subscription } = await supabase
      .from('driver_subscriptions')
      .select('id, rides_remaining, status, end_date')
      .eq('driver_id', user.id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const hasActiveSub = subscription && subscription.rides_remaining > 0;

    if (!hasActiveSub) {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      const commission = (ride?.estimated_price || 0) * 0.12;
      if ((wallet?.balance || 0) < commission) {
        toast.error('Solde insuffisant', {
          description: `Wallet requis : ${Math.ceil(commission).toLocaleString()} CDF minimum`
        });
        setLoading(false);
        return;
      }
      toast.info('Course acceptée (Commission)');
    } else {
      toast.success('Course acceptée (Abonnement)', {
        description: `Courses restantes : ${subscription.rides_remaining - 1}`
      });
    }

    await updateStatus('pickup');
    setLoading(false);
  };

  const handleStartRide = () => {
    const status = ride?.rideType === 'transport' ? 'in_progress' : 'picked_up';
    updateStatus(status);
  };

  const completeBookingDirect = async () => {
    const { error } = await supabase
      .from('transport_bookings')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', ride!.id);
    if (error) throw error;
  };

  const handleCompleteRide = async () => {
    if (!ride?.id || !user?.id) return;
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'complete-ride-with-commission',
        {
          body: {
            rideId: ride.id,
            rideType: ride.rideType,
            driverId: user.id,
            finalAmount: ride.actual_price || ride.estimated_price || 0,
            paymentMethod: ride.payment_method || 'cash'
          }
        }
      );

      if (fnError || !data?.success) {
        console.warn('⚠️ Edge function échouée, fallback direct:', fnError || data?.message);
        await completeBookingDirect();
      } else if (data.billing_mode === 'subscription') {
        toast.success('Course terminée', {
          description: `Courses restantes : ${data.rides_remaining ?? 'N/A'}`
        });
      } else {
        toast.success('Course terminée', {
          description: `Net : ${data.driver_net_amount?.toLocaleString()} CDF | Commission : ${data.commission?.amount?.toLocaleString()} CDF`
        });
      }
    } catch {
      try {
        await completeBookingDirect();
      } catch (fallbackError) {
        console.error('❌ Fallback échoué:', fallbackError);
        toast.error('Impossible de terminer la course, réessayez');
        setLoading(false);
        return;
      }
    }

    toast.success('Course terminée');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setRide(prev => prev ? { ...prev, status: 'completed' } : null);
    setLoading(false);
  };

  const handleDriverCancel = async (reason: string, cancellationType: string) => {
    if (!ride?.id || !ride.rideType || !user?.id) return;

    setLoading(true);
    const table = ride.rideType === 'transport' ? 'transport_bookings' : 'delivery_orders';

    const { error } = await supabase.from(table).update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancellation_reason: reason,
      cancellation_type: 'driver'
    }).eq('id', ride.id);

    await supabase.from('cancellation_history').insert({
      reference_id: ride.id,
      reference_type: ride.rideType === 'transport' ? 'transport_booking' : 'delivery_order',
      cancelled_by: user.id,
      cancellation_type: cancellationType,
      reason,
      status_at_cancellation: ride.status
    });

    setLoading(false);
    setShowCancelDialog(false);

    if (!error) {
      toast.warning('Course annulée', { description: 'Le client a été notifié' });
      setRide(null);
    } else {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  if (!ride) return null;

  // ── Phases ──────────────────────────────────────────────────────────────────
  const isPhase1 = ['driver_assigned', 'accepted', 'driver_en_route'].includes(ride.status);
  const isPhase2 = ride.status === 'pickup';
  const isPhase3 = ride.status === 'in_progress' || ride.status === 'picked_up';
  const isCompleted = ride.status === 'completed' || ride.status === 'delivered';
  const showAcceptReject = ride.status === 'driver_assigned';

  const pickupCoords = ride.pickup_coordinates as { lat: number; lng: number } | null;
  const destCoords = (ride.destination_coordinates || ride.delivery_coordinates) as { lat: number; lng: number } | null;

  const openInMaps = (coords: { lat: number; lng: number } | null) => {
    if (!coords?.lat || !coords?.lng) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
      '_blank'
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Card className="border-primary shadow-lg overflow-hidden">
        <CardContent className="p-4 space-y-4">

          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">
                {ride.rideType === 'transport' ? '🚗 Course' : '📦 Livraison'}
              </h3>
              <Badge variant="secondary">{ride.status}</Badge>
            </div>
            {ride.estimated_price && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {ride.estimated_price.toLocaleString()} CDF
                </div>
                <div className="text-xs text-muted-foreground">
                  {ride.distance_km?.toFixed(1)} km
                </div>
              </div>
            )}
          </div>

          {/* Itinéraire texte */}
          <div className="space-y-2 bg-muted/50 rounded-lg p-3">
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
              <div className="flex-1">
                <p className="font-medium">Départ</p>
                <p className="text-muted-foreground">{ride.pickup_location}</p>
              </div>
            </div>
            <div className="ml-1 border-l-2 border-dashed h-4" />
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5" />
              <div className="flex-1">
                <p className="font-medium">Arrivée</p>
                <p className="text-muted-foreground">
                  {ride.destination_location || ride.delivery_location || ride.destination || 'Destination'}
                </p>
              </div>
            </div>
          </div>

          {/* ── driver_assigned : carte pickup seule (sans nav label) ─────── */}
          {ride.status === 'driver_assigned' && pickupCoords && (
            <div className="relative h-48 rounded-xl overflow-hidden border">
              <StaticMapView destination={pickupCoords} />
            </div>
          )}

          {/* ── accepted / driver_en_route : nav vers client ─────────────── */}
          {['accepted', 'driver_en_route'].includes(ride.status) && pickupCoords && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <NavigationIcon className="w-4 h-4 text-orange-500" />
                Naviguer vers le client
              </p>
              <div className="relative h-48 rounded-xl overflow-hidden border">
                <StaticMapView destination={pickupCoords} />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openInMaps(pickupCoords)}
                className="w-full gap-2 text-muted-foreground"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ouvrir dans Maps
              </Button>
            </div>
          )}

          {/* ── Phase 2 : en attente du client ──────────────────────────────── */}
          {isPhase2 && (
            <div className="flex items-center justify-center gap-2 py-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                En attente du client
              </p>
            </div>
          )}

          {/* ── Phase 3 : carte vers destination ────────────────────────────── */}
          {isPhase3 && pickupCoords && destCoords && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <NavigationIcon className="w-4 h-4 text-green-600" />
                Naviguer vers destination
              </p>
              <div className="relative h-48 rounded-xl overflow-hidden border">
                <StaticMapView pickup={pickupCoords} destination={destCoords} />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openInMaps(destCoords)}
                className="w-full gap-2 text-muted-foreground"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ouvrir dans Maps
              </Button>
            </div>
          )}

          {/* ── Résumé course terminée ─────────────────────────────────────── */}
          {isCompleted && (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-2 py-5 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <p className="font-bold text-green-700 dark:text-green-400 text-base">Course terminée !</p>
                {ride.estimated_price != null && (
                  <div className="text-3xl font-bold">{ride.estimated_price.toLocaleString()} CDF</div>
                )}
                {ride.distance_km != null && (
                  <p className="text-sm text-muted-foreground">{ride.distance_km.toFixed(1)} km</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setRide(null)}
              >
                Fermer
              </Button>
            </div>
          )}

          {/* Contact client */}
          {!isCompleted && (ride.customer_phone || ride.sender_phone || ride.recipient_phone) && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const phone = ride.customer_phone || ride.sender_phone || ride.recipient_phone;
                window.location.href = `tel:${phone}`;
              }}
            >
              <Phone className="w-4 h-4 mr-2" />
              Appeler {ride.customer_name || ride.sender_name || ride.recipient_name || 'le client'}
            </Button>
          )}

          {/* ── Boutons d'action ────────────────────────────────────────────── */}
          <div className="space-y-2">

            {/* Refuser / Accepter — uniquement driver_assigned */}
            {showAcceptReject && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={loading}
                >
                  <X className="w-4 h-4 mr-1" />
                  Refuser
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    : <CheckCircle className="w-4 h-4 mr-1" />}
                  Accepter
                </Button>
              </div>
            )}

            {/* Je suis arrivé — accepted + driver_en_route seulement (pas driver_assigned) */}
            {['accepted', 'driver_en_route'].includes(ride.status) && (
              <Button
                onClick={() => updateStatus('pickup')}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <MapPin className="w-4 h-4 mr-2" />}
                Je suis arrivé
              </Button>
            )}

            {/* Démarrer la course — phase 2 */}
            {isPhase2 && (
              <Button
                onClick={handleStartRide}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <CheckCircle className="w-4 h-4 mr-2" />}
                Client à bord — Démarrer
              </Button>
            )}

            {/* Terminer la course — phase 3 */}
            {isPhase3 && (
              <Button
                onClick={handleCompleteRide}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Star className="w-4 h-4 mr-2" />}
                Course terminée
              </Button>
            )}

          </div>
        </CardContent>
      </Card>

      {/* Dialog d'annulation */}
      {ride && (
        <CancellationDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleDriverCancel}
          title="Annuler la course"
          userType="driver"
          bookingType={ride.rideType === 'transport' ? 'transport' : 'delivery'}
          bookingDetails={{ id: ride.id, status: ride.status, price: ride.estimated_price }}
        />
      )}
    </>
  );
};
