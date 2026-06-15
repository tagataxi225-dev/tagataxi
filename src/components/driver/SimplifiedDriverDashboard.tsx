import React, { useState, useEffect, useCallback, useRef } from 'react';
import DriverScreen from './DriverScreen';
import { BackgroundLocationDisclosure } from './BackgroundLocationDisclosure';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverRideState, type RidePhase } from '@/hooks/useDriverRideState';
import { useDriverEarnings } from '@/hooks/useDriverEarnings';
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat';
import { useDriverGeolocation } from '@/hooks/useDriverGeolocation';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useBackgroundTracking } from '@/hooks/useBackgroundTracking';
import { useAuth } from '@/hooks/useAuth';
import { useDriverProfile } from '@/hooks/useDriverProfile';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cityDetectionService } from '@/services/cityDetectionService';
import { getCityOrDefault } from '@/config/coveredCities';
import { RatingDialog } from '@/components/rating/RatingDialog';
import { driverNotificationService } from '@/services/driverNotificationService';

function getLocalCurrency(): 'CDF' | 'XOF' {
  const selected = cityDetectionService.getSelectedCity();
  const cityName = selected?.name
    ?? (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Abidjan' ? 'Abidjan' : 'Kinshasa');
  return getCityOrDefault(cityName) === 'Abidjan' ? 'XOF' : 'CDF';
}

type DriverUIState =
  | 'offline'
  | 'online_idle'
  | 'request_incoming'
  | 'en_route_to_pickup'
  | 'arrived_at_pickup'
  | 'in_progress'
  | 'completed';

// Machine à états (useDriverRideState) → état UI de DriverScreen
const PHASE_TO_UI: Record<RidePhase, DriverUIState> = {
  IDLE: 'online_idle',
  INCOMING: 'request_incoming',
  ACCEPTED: 'en_route_to_pickup',
  AT_PICKUP: 'arrived_at_pickup',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'online_idle', // recouvert par l'overlay d'annulation
};

interface SimplifiedDriverDashboardProps {
  serviceType: 'taxi' | 'delivery';
  onRideComplete?: () => void;
}

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const SimplifiedDriverDashboard: React.FC<SimplifiedDriverDashboardProps> = ({ serviceType, onRideComplete }) => {
  const { user } = useAuth();
  const { profile: { displayName: driverProfileName } } = useDriverProfile();

  const {
    pendingNotifications,
    setPendingNotifications,
    acceptOrder,
    rejectOrder,
    completeOrder,
  } = useDriverDispatch();

  // ✅ Source de vérité unique du cycle de vie de la course
  const { phase, ride: activeRide, isTransitioning, transition, loadActive, reset } = useDriverRideState();

  const { stats, refresh: refreshStats } = useDriverEarnings();
  const { status, goOnline, goOffline } = useDriverStatus();
  const { location } = useDriverGeolocation({ autoSync: true });
  const { needsDisclosure, acceptDisclosure, declineDisclosure } = useBackgroundTracking();
  useDriverHeartbeat();

  const [countdownSeconds, setCountdownSeconds] = useState(15);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [onlineHours, setOnlineHours] = useState(0);
  const [showClientRating, setShowClientRating] = useState(false);
  const [showCancelOverlay, setShowCancelOverlay] = useState(false);
  const [pendingAction, setPendingAction] = useState<'arrived' | 'complete' | null>(null);
  const [completedBookingData, setCompletedBookingData] = useState<{
    clientId: string;
    clientName: string;
    bookingId: string;
  } | null>(null);

  // Empêche le double-tap sur tous les handlers d'action
  const actionGuardRef = useRef(false);
  // Conserve les données de la course pour l'affichage pendant les transitions
  const lastRawRef = useRef<any>(null);

  const relevantNotifications = pendingNotifications.filter(n =>
    serviceType === 'taxi' ? n.type === 'taxi' : (n.type === 'delivery' || n.type === 'marketplace' || n.type === 'delivery_assignment')
  );
  const pendingNotif = relevantNotifications[0] ?? null;

  // Le booking actif (DB) prime, sinon la notification entrante
  const activeRaw: any = activeRide?.raw ?? null;
  const rawBooking: any = activeRaw ?? (pendingNotif ? (pendingNotif.data ?? pendingNotif) : null);

  const driverState: DriverUIState = !status.isOnline ? 'offline' : PHASE_TO_UI[phase];

  const ride = rawBooking ? (() => {
    const pickupCoords = rawBooking.pickup_coordinates as { lat: number; lng: number } | undefined;
    const destCoords = (rawBooking.destination_coordinates ?? rawBooking.delivery_coordinates) as { lat: number; lng: number } | undefined;
    const distanceKm = (pickupCoords && destCoords)
      ? Math.round(haversineKm(pickupCoords.lat, pickupCoords.lng, destCoords.lat, destCoords.lng) * 1.3 * 10) / 10
      : 0;
    const result = {
      id: rawBooking.id,
      pickupLabel: rawBooking.pickup_location || '',
      destinationLabel: rawBooking.destination || rawBooking.delivery_location || '',
      pickupCoords,
      destinationCoords: destCoords,
      fareAmount: rawBooking.final_agreed_price || rawBooking.client_proposed_price || rawBooking.estimated_price,
      waitingFee: rawBooking.waiting_fee || 0,
      currency: getLocalCurrency(),
      distanceKm,
      clientName: rawBooking.customer_name || rawBooking.client_name || 'Client',
      clientPhone: rawBooking.customer_phone || rawBooking.client_phone,
      clientPhoto: rawBooking.customer_avatar || null,
    };
    lastRawRef.current = result;
    return result;
  })() : (lastRawRef.current ?? undefined);

  const driverFirstName = driverProfileName ?? 'Chauffeur';

  // INCOMING piloté par la présence d'une notification entrante
  useEffect(() => {
    if (pendingNotif && phase === 'IDLE') {
      transition('INCOMING');
    } else if (!pendingNotif && phase === 'INCOMING') {
      transition('IDLE');
    }
  }, [pendingNotif, phase, transition]);

  // Countdown pour request_incoming — auto-reject à 0
  useEffect(() => {
    if (phase !== 'INCOMING' || !pendingNotif) {
      setCountdownSeconds(15);
      return;
    }
    setCountdownSeconds(15);
    let remaining = 15;
    const interval = setInterval(() => {
      remaining -= 1;
      setCountdownSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        rejectOrder(pendingNotif.id);
        transition('IDLE');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, pendingNotif?.id, rejectOrder, transition]);

  // Chronomètre in_progress
  useEffect(() => {
    if (phase !== 'IN_PROGRESS') { setElapsedMinutes(0); return; }
    const interval = setInterval(() => setElapsedMinutes(prev => prev + 1), 60000);
    return () => clearInterval(interval);
  }, [phase, activeRide?.id]);

  // Compteur heures en ligne
  useEffect(() => {
    if (!status.isOnline) { setOnlineHours(0); return; }
    const interval = setInterval(() => setOnlineHours(prev => prev + 1 / 60), 60000);
    return () => clearInterval(interval);
  }, [status.isOnline]);

  // ride-accepted / bidding-closed → ACCEPTED + resync
  useEffect(() => {
    const handler = (e: any) => {
      const bookingId = e?.detail?.bookingId;
      if (bookingId) {
        setPendingNotifications(prev => prev.filter(n => n.orderId !== bookingId));
      }
      transition('ACCEPTED');
      loadActive();
      setTimeout(() => loadActive(), 800);
      setTimeout(() => loadActive(), 2000);
      setTimeout(() => loadActive(), 4000);
    };
    window.addEventListener('ride-accepted', handler);
    window.addEventListener('bidding-closed', handler);
    return () => {
      window.removeEventListener('ride-accepted', handler);
      window.removeEventListener('bidding-closed', handler);
    };
  }, [transition, loadActive, setPendingNotifications]);

  // Sync: statusChanges → transition immédiate + loadActive
  useEffect(() => {
    if (!user) return;
    const unsub = driverNotificationService.subscribeToStatusChanges((orderId, newStatus) => {
      if (['pickup', 'picked_up'].includes(newStatus)) transition('AT_PICKUP');
      else if (['in_progress', 'in_transit'].includes(newStatus)) transition('IN_PROGRESS');
      else if (['completed', 'delivered'].includes(newStatus)) transition('COMPLETED');
      else if (newStatus === 'accepted') transition('ACCEPTED');
      loadActive();
    });
    return unsub;
  }, [user, transition, loadActive]);

  // Annulation par le client → CANCELLED, overlay 3s, puis IDLE
  useEffect(() => {
    if (!status.isOnline || !user) return;
    const unsub = driverNotificationService.subscribeToCancellation(({ orderId }) => {
      setPendingNotifications(prev => prev.filter(n => n.orderId !== orderId));
      const ok = transition('CANCELLED');
      if (!ok) return;
      setShowCancelOverlay(true);
      toast.info('Course annulée par le client');
      setTimeout(() => {
        setShowCancelOverlay(false);
        reset();
      }, 3000);
    });
    return unsub;
  }, [status.isOnline, user, transition, reset, setPendingNotifications]);

  const handleToggleOnline = useCallback(async () => {
    if (status.isOnline) {
      await goOffline();
    } else {
      await goOnline(location?.latitude, location?.longitude);
    }
  }, [status.isOnline, goOnline, goOffline, location?.latitude, location?.longitude]);

  const handleAcceptRide = useCallback(async () => {
    if (!pendingNotif || actionGuardRef.current) return;
    actionGuardRef.current = true;
    const ok = transition('ACCEPTED');
    if (!ok) { actionGuardRef.current = false; return; }
    try {
      const success = await acceptOrder(pendingNotif);
      if (success) {
        toast.success('Course acceptée !');
        setPendingNotifications(prev => prev.filter(n => n.id !== pendingNotif.id));
        await loadActive();
      } else {
        // Rollback : l'écriture DB a échoué → resync depuis la DB
        await loadActive();
      }
    } finally {
      actionGuardRef.current = false;
    }
  }, [pendingNotif, acceptOrder, transition, loadActive, setPendingNotifications]);

  const handleDeclineRide = useCallback(() => {
    if (!pendingNotif) return;
    rejectOrder(pendingNotif.id);
    transition('IDLE');
    toast.info('Course refusée');
  }, [pendingNotif, rejectOrder, transition]);

  const handleArrivedAtPickup = useCallback(async () => {
    if (pendingAction !== 'arrived') { setPendingAction('arrived'); return; }
    setPendingAction(null);
    if (!activeRide || actionGuardRef.current) return;
    actionGuardRef.current = true;
    const ok = transition('AT_PICKUP');
    if (!ok) { actionGuardRef.current = false; return; }
    const { id, type } = activeRide;
    const isTaxi = type === 'taxi';
    try {
      const { error } = await (isTaxi
        ? supabase
            .from('transport_bookings')
            .update({ status: 'pickup', driver_arrived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', id).eq('driver_id', user!.id)
        : supabase
            .from('delivery_orders')
            .update({ status: 'picked_up', updated_at: new Date().toISOString() })
            .eq('id', id).eq('driver_id', user!.id));
      if (error) {
        toast.error('Erreur, réessayez');
        transition('ACCEPTED'); // rollback optimistic
      } else {
        // Forcer le resync après 800ms si Realtime ne fire pas
        setTimeout(() => loadActive(), 800);
      }
    } finally {
      actionGuardRef.current = false;
    }
  }, [activeRide, transition, loadActive, user]);

  const handleStartRide = useCallback(async () => {
    if (!activeRide || actionGuardRef.current) return;
    actionGuardRef.current = true;
    const ok = transition('IN_PROGRESS');
    if (!ok) { actionGuardRef.current = false; return; }
    const { id, type } = activeRide;
    const newStatus = type === 'delivery' ? 'in_transit' : 'in_progress';
    const table = type === 'taxi' ? 'transport_bookings' : 'delivery_orders';
    try {
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id).eq('driver_id', user!.id);
      if (error) {
        toast.error('Erreur de mise à jour');
        transition('AT_PICKUP'); // rollback
      } else {
        setTimeout(() => loadActive(), 800);
      }
    } finally {
      actionGuardRef.current = false;
    }
  }, [activeRide, transition, loadActive, user]);

  const handleCompleteRide = useCallback(async () => {
    if (pendingAction !== 'complete') { setPendingAction('complete'); return; }
    setPendingAction(null);
    if (!activeRide || actionGuardRef.current) return;
    actionGuardRef.current = true;
    const ok = transition('COMPLETED');
    if (!ok) { actionGuardRef.current = false; return; }
    const { id, type, raw } = activeRide;
    try {
      const success = await completeOrder(id, type as any);
      if (success) {
        toast.success('Course terminée !');
        refreshStats();
        onRideComplete?.();
        if (raw?.user_id) {
          setCompletedBookingData({
            clientId: raw.user_id,
            clientName: raw.customer_name || raw.client_name || 'Client',
            bookingId: raw.id,
          });
          setShowClientRating(true);
        // Rechercher les courses disponibles immédiatement après la fin
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('search-nearby-rides'));
        }, 1500);
        }
      } else {
        await loadActive(); // rollback
      }
    } finally {
      actionGuardRef.current = false;
    }
  }, [activeRide, completeOrder, transition, loadActive, refreshStats, onRideComplete]);

  const handleCallClient = useCallback(() => {
    if (ride?.clientPhone) window.open(`tel:${ride.clientPhone}`);
    else toast.info('Numéro non disponible');
  }, [ride?.clientPhone]);

  const handleMessageClient = useCallback(() => {
    toast.info('Messagerie bientôt disponible');
  }, []);

  const handleNavigate = useCallback((lat: number, lng: number) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      '_blank'
    );
  }, []);

  const handleContinue = useCallback(() => {
    setCompletedBookingData(null);
    setShowClientRating(false);
    lastRawRef.current = null;
    reset();
    refreshStats();
  }, [reset, refreshStats]);

  // Fallback timezone direct — jamais undefined, la carte se centre dès le premier rendu
  const tzFallbackCenter = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Abidjan'
    ? { lat: 5.36, lng: -4.01 }
    : { lat: -4.32, lng: 15.31 };

  const mapCenter = React.useMemo(() => {
    if (!location) return tzFallbackCenter;
    return {
      lat: Math.round(location.latitude * 100) / 100,
      lng: Math.round(location.longitude * 100) / 100
    };
  }, [
    location ? Math.round(location.latitude * 100) : null,
    location ? Math.round(location.longitude * 100) : null
  ]);

  const mapDestination = activeRaw
    ? (serviceType === 'taxi'
        ? activeRaw.destination_coordinates
        : activeRaw.delivery_coordinates) as { lat: number; lng: number } | undefined
    : undefined;

  const mapSlot = (
    <div className="relative w-full h-full">
      <GoogleMapsKwenda
        center={mapCenter}
        zoom={15}
        height="100%"
        driverLocation={location ? { lat: location.latitude, lng: location.longitude, heading: null } : undefined}
        pickup={activeRaw?.pickup_coordinates as { lat: number; lng: number } | undefined}
        destination={mapDestination}
        showRoute={(() => {
          if (!activeRaw) return false;
          const pickup = activeRaw.pickup_coordinates as { lat?: number; lng?: number } | undefined;
          return !!(pickup?.lat && pickup?.lng && mapDestination?.lat && mapDestination?.lng);
        })()}
      />
    </div>
  );

  return (
    <>
      <BackgroundLocationDisclosure
        open={needsDisclosure}
        onAccept={acceptDisclosure}
        onDecline={declineDisclosure}
      />
      <DriverScreen
        driverState={driverState}
        serviceType={serviceType}
        driverFirstName={driverFirstName}
        ride={ride}
        stats={{
          todayRides: stats.todayTrips || 0,
          todayEarnings: stats.todayEarnings || 0,
          onlineHours: Math.round(onlineHours * 10) / 10,
          currency: getLocalCurrency(),
        }}
        countdownSeconds={countdownSeconds}
        elapsedMinutes={elapsedMinutes}
        onToggleOnline={handleToggleOnline}
        onAcceptRide={handleAcceptRide}
        onDeclineRide={handleDeclineRide}
        onArrivedAtPickup={handleArrivedAtPickup}
        onStartRide={handleStartRide}
        onCompleteRide={handleCompleteRide}
        onCallClient={handleCallClient}
        onMessageClient={handleMessageClient}
        onNavigate={handleNavigate}
        onContinue={handleContinue}
        mapSlot={mapSlot}
      />

      {showCancelOverlay && (
        <div className="fixed inset-0 z-[600] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl px-6 py-5 mx-6 text-center shadow-xl">
            <div className="text-4xl mb-2">🚫</div>
            <p className="font-bold text-gray-900">Course annulée</p>
            <p className="text-sm text-gray-500 mt-1">Le client a annulé la course</p>
          </div>
        </div>
      )}

      {/* ── Confirmation dialog ── */}
      {pendingAction && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif' }}>
          <div style={{ width: '100%', background: '#fff', borderRadius: '28px 28px 0 0', padding: '28px 24px 40px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{pendingAction === 'arrived' ? '📍' : '✅'}</div>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1E', margin: '0 0 8px' }}>
                {pendingAction === 'arrived' ? "Confirmer l'arrivée ?" : 'Terminer la course ?'}
              </p>
              <p style={{ fontSize: 14, color: '#636366', margin: 0 }}>
                {pendingAction === 'arrived' ? "Le client sera notifié que vous êtes arrivé." : 'Cette action est irréversible. Le paiement sera déclenché.'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button"
                onClick={() => { const a = pendingAction; setPendingAction(null); if (a === 'arrived') handleArrivedAtPickup(); else handleCompleteRide(); }}
                style={{ width: '100%', padding: '16px', borderRadius: 18, background: pendingAction === 'arrived' ? '#FF9F0A' : '#E8353B', border: 'none', fontSize: 16, fontWeight: 800, color: '#fff', cursor: 'pointer', touchAction: 'manipulation', boxShadow: `0 6px 20px ${pendingAction === 'arrived' ? '#FF9F0A55' : '#E8353B55'}` }}>
                {pendingAction === 'arrived' ? '✓ Je suis arrivé' : '✓ Terminer la course'}
              </button>
              <button type="button" onClick={() => setPendingAction(null)}
                style={{ width: '100%', padding: '14px', borderRadius: 16, background: '#F2F2F7', border: 'none', fontSize: 15, fontWeight: 600, color: '#636366', cursor: 'pointer', touchAction: 'manipulation' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <RatingDialog
        open={showClientRating}
        onOpenChange={setShowClientRating}
        ratedUserId={completedBookingData?.clientId || ''}
        ratedUserName={completedBookingData?.clientName || 'Client'}
        ratedUserType="client"
        orderId={completedBookingData?.bookingId || ''}
        orderType="transport"
        onSuccess={() => setShowClientRating(false)}
      />
    </>
  );
};
