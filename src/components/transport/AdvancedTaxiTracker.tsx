import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getCurrencyByCity } from '@/utils/formatCurrency';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Navigation,
  Clock,
  Star,
  AlertTriangle,
  Car,
  Route,
  Activity,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import StaticMapView from './map/StaticMapView';
import TaxiChat from './TaxiChat';
import TaxiPaymentModal from '@/components/payment/TaxiPaymentModal';
import { useDriverRealTimeEta } from '@/hooks/useDriverRealTimeEta';
import RideTrackingScreen from './RideTrackingScreen';
import { WaitingNotification } from '@/components/client/WaitingNotification';

interface AdvancedTaxiTrackerProps {
  bookingId: string;
  onBack: () => void;
}

interface BookingData {
  id: string;
  pickup_location: string;
  destination: string;
  pickup_coordinates?: any;
  destination_coordinates?: any;
  vehicle_type: string;
  estimated_price: number;
  actual_price?: number;
  status: string;
  created_at: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_photo?: string;
  driver_rating?: number;
  vehicle_model?: string;
  vehicle_plate?: string;
  vehicle_color?: string;
  partner_name?: string;
  estimated_duration?: number;
  distance_km?: number;
  rated?: boolean;
  user_id?: string;
  client_name?: string;
  client_phone?: string;
}

interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  last_update: string;
}

const STATUS_CONFIG = {
  pending: { 
    label: 'Recherche en cours', 
    color: 'bg-amber-500', 
    icon: Clock,
    description: 'Recherche d\'un chauffeur disponible...',
    progress: 10
  },
  accepted: {
    label: 'Chauffeur en route',
    color: 'bg-blue-500',
    icon: Car,
    description: 'Un chauffeur a accepté votre course',
    progress: 30
  },
  driver_assigned: {
    label: 'Chauffeur assigné',
    color: 'bg-blue-500',
    icon: Car,
    description: 'Un chauffeur a accepté votre course',
    progress: 30
  },
  driver_en_route: { 
    label: 'En route vers vous', 
    color: 'bg-orange-500', 
    icon: Navigation,
    description: 'Le chauffeur arrive à votre position',
    progress: 50
  },
  pickup: {
    label: 'Prise en charge',
    color: 'bg-purple-500',
    icon: Activity,
    description: 'Vous êtes à bord',
    progress: 70
  },
  picked_up: {
    label: 'Prise en charge',
    color: 'bg-purple-500',
    icon: Activity,
    description: 'Vous êtes à bord',
    progress: 70
  },
  in_progress: { 
    label: 'En route', 
    color: 'bg-blue-600', 
    icon: Route,
    description: 'Direction votre destination',
    progress: 85
  },
  completed: { 
    label: 'Terminée', 
    color: 'bg-green-500', 
    icon: Star,
    description: 'Course terminée avec succès',
    progress: 100
  },
  cancelled: { 
    label: 'Annulée', 
    color: 'bg-red-500', 
    icon: AlertTriangle,
    description: 'Course annulée',
    progress: 0
  }
};

const CANCELLABLE_STATUSES = ['pending', 'searching', 'driver_assigned'];

function mapStatus(s: string): 'searching' | 'accepted' | 'arriving' | 'en_route' | 'completed' {
  if (['pending', 'searching'].includes(s)) return 'searching';
  if (['driver_assigned', 'accepted'].includes(s)) return 'accepted';
  if (s === 'driver_en_route') return 'arriving';
  if (s === 'pickup') return 'arrived';
  if (['picked_up', 'in_progress'].includes(s)) return 'en_route';
  if (s === 'cancelled') return 'searching';
  return 'completed';
}

export default function AdvancedTaxiTracker({ bookingId, onBack }: AdvancedTaxiTrackerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [driverArrivedAt, setDriverArrivedAt] = useState<string | null>(null);
  const [waitingFee, setWaitingFee] = useState(0);

  useEffect(() => {
    if (!driverArrivedAt) return;
    const t = setInterval(() => {
      const sec = Math.floor((Date.now() - new Date(driverArrivedAt).getTime()) / 1000);
      const min = Math.floor(sec / 60);
      const currency = getCurrencyByCity(booking?.city || 'Kinshasa');
      setWaitingFee(Math.max(0, min - 5) * (currency === 'XOF' ? 100 : 500));
    }, 1000);
    return () => clearInterval(t);
  }, [driverArrivedAt, booking?.city]);

  useEffect(() => {
    if (booking?.status === 'in_progress' && waitingFee > 0) {
      supabase.from('transport_bookings').update({ waiting_fee: waitingFee }).eq('id', booking.id);
    }
  }, [booking?.status, waitingFee]);

  useEffect(() => {
    if (booking?.status === 'pickup' && !driverArrivedAt) {
      setDriverArrivedAt(booking.driver_arrived_at || new Date().toISOString());
    }
    if (booking?.status !== 'pickup' && booking?.status !== 'in_progress' && booking?.status !== 'completed') setDriverArrivedAt(null);
  }, [booking?.status]);

  // ETA temps réel basé sur la position GPS du chauffeur
  const pickupCoords = useMemo(() => {
    if (!booking?.pickup_coordinates) return null;
    const c = booking.pickup_coordinates;
    return typeof c === 'object' && c.lat && c.lng ? { lat: c.lat, lng: c.lng } : null;
  }, [booking?.pickup_coordinates]);

  const driverPos = useMemo(() => {
    if (!driverLocation) return null;
    return { lat: driverLocation.lat, lng: driverLocation.lng, speed: driverLocation.speed };
  }, [driverLocation]);

  const realTimeEta = useDriverRealTimeEta(driverPos, pickupCoords);

  const isDriverApproaching = booking?.status === 'driver_assigned' || booking?.status === 'driver_en_route';

  // Données calculées
  const statusConfig = useMemo(() => {
    if (!booking) return null;
    return STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
  }, [booking?.status]);

  const canShowRoute = useMemo(() => {
    return booking?.pickup_coordinates && booking?.destination_coordinates;
  }, [booking]);

  const getCoordinates = (coords: any) => {
    if (!coords) return undefined;
    if (typeof coords === 'object' && coords.lat && coords.lng) {
      return { lat: coords.lat, lng: coords.lng };
    }
    return undefined;
  };

  // Auto-ouvrir le paiement quand la course est terminée
  useEffect(() => {
    if (booking?.status === 'completed') {
      setShowPayment(true);
    }
  }, [booking?.status]);

  // ✅ FIX: Stabilize driver_id ref to prevent realtime subscription loop
  const trackedDriverIdRef = useRef<string | null>(null);

  // ⚡ PHASE 2: Fusion des 2 subscriptions en 1 + throttle location updates
  useEffect(() => {
    loadBookingData();
    
    // Throttle pour location updates (max 1/sec)
    let locationUpdateTimer: NodeJS.Timeout;
    const throttledLocationUpdate = (data: any) => {
      clearTimeout(locationUpdateTimer);
      locationUpdateTimer = setTimeout(() => {
        setDriverLocation({
          lat: data.latitude,
          lng: data.longitude,
          heading: data.heading,
          speed: data.speed,
          last_update: data.updated_at
        });
      }, 1000);
    };

    // Haptic feedback helper (Capacitor-first, vibrate fallback)
    const triggerStatusHaptic = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { Haptics, NotificationType } = await import('@capacitor/haptics');
          await Haptics.notification({ type: NotificationType.Success });
          return;
        }
      } catch {}
      try { navigator.vibrate?.([100, 50, 100]); } catch {}
    };

    // Channel unique fusionné pour booking + driver location
    const channel = supabase
      .channel(`booking-tracker-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          const newData = payload.new as any;

          // Mise à jour immédiate du state local — pas de refetch
          setBooking(prev => prev ? { ...prev, ...newData } : null);

          // Track driver_id changes — subscribe to location in next effect cycle
          if (newData.driver_id && newData.driver_id !== trackedDriverIdRef.current) {
            trackedDriverIdRef.current = newData.driver_id;
          }

          // Changement de statut
          const newStatus = newData.status;

          // Paiement immédiat dès que la course est terminée
          if (newStatus === 'completed') {
            setShowPayment(true);
          }

          const config = STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG];
          if (config) {
            toast({
              title: config.label,
              description: config.description,
            });
            triggerStatusHaptic();
          }
        }
      );

    channel.subscribe();

    return () => {
      clearTimeout(locationUpdateTimer);
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  // Polling fallback — refetch booking row every 3s in case Realtime UPDATE is missed
  useEffect(() => {
    if (!bookingId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();
      console.warn('[Tracker] poll status:', data?.status);
      if (data) setBooking(prev => prev ? { ...prev, ...data } : data as any);
    }, 3000);
    return () => clearInterval(interval);
  }, [bookingId]);

  // ✅ Separate effect for driver location tracking — only re-subscribes when driver_id actually changes
  useEffect(() => {
    const driverId = booking?.driver_id;
    if (!driverId) return;
    // Only subscribe once per unique driver_id
    if (trackedDriverIdRef.current === driverId) {
      // Already tracked via the booking update above, but we need the channel
    }
    trackedDriverIdRef.current = driverId;

    let locationUpdateTimer: NodeJS.Timeout;
    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          clearTimeout(locationUpdateTimer);
          locationUpdateTimer = setTimeout(() => {
            setDriverLocation({
              lat: (payload.new as any).latitude,
              lng: (payload.new as any).longitude,
              heading: (payload.new as any).heading,
              speed: (payload.new as any).speed,
              last_update: (payload.new as any).updated_at
            });
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(locationUpdateTimer);
      supabase.removeChannel(channel);
    };
    // Use driver_id string directly — stable value, not object reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.driver_id]);

  const loadBookingData = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      // Charger les infos du chauffeur si assigné
      let driverInfo = null;
      let partnerVehicle = null;
      let partnerName: string | undefined;
      if (data.driver_id) {
        const [chauffeurRes, locationRes, vehicleRes, partnerDriverRes] = await Promise.all([
          supabase
            .from('chauffeurs')
            .select('display_name, phone_number, rating_average, vehicle_model, vehicle_plate, vehicle_color, profile_photo_url')
            .eq('user_id', data.driver_id)
            .maybeSingle(),
          supabase
            .from('driver_locations')
            .select('latitude, longitude, heading, speed, updated_at')
            .eq('driver_id', data.driver_id)
            .maybeSingle(),
          supabase
            .from('partner_taxi_vehicles')
            .select('brand, model, license_plate, color, vehicle_class')
            .eq('assigned_driver_id', data.driver_id)
            .maybeSingle(),
          supabase
            .from('partner_drivers')
            .select('partner_id')
            .eq('driver_id', data.driver_id)
            .eq('status', 'active')
            .maybeSingle(),
        ]);

        driverInfo = chauffeurRes.data;
        partnerVehicle = vehicleRes.data;

        if (partnerDriverRes.data?.partner_id) {
          const { data: partenaireData } = await supabase
            .from('partenaires')
            .select('company_name')
            .eq('id', partnerDriverRes.data.partner_id)
            .maybeSingle();
          partnerName = partenaireData?.company_name || undefined;
        }

        if (locationRes.data) {
          setDriverLocation({
            lat: locationRes.data.latitude,
            lng: locationRes.data.longitude,
            heading: locationRes.data.heading,
            speed: locationRes.data.speed,
            last_update: locationRes.data.updated_at
          });
        }
      }

      // Charger les infos du client
      let clientInfo = null;
      if (data.user_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('display_name, phone_number')
          .eq('user_id', data.user_id)
          .single();
        
        clientInfo = clientData;
      }

      setBooking({
        ...data,
        driver_name: driverInfo?.display_name,
        driver_phone: driverInfo?.phone_number,
        driver_photo: driverInfo?.profile_photo_url || undefined,
        driver_rating: driverInfo?.rating_average,
        vehicle_model: partnerVehicle
          ? `${partnerVehicle.brand} ${partnerVehicle.model}`.trim()
          : driverInfo?.vehicle_model,
        vehicle_plate: partnerVehicle?.license_plate || driverInfo?.vehicle_plate,
        vehicle_color: partnerVehicle?.color || driverInfo?.vehicle_color,
        partner_name: partnerName,
        client_name: clientInfo?.display_name,
        client_phone: clientInfo?.phone_number,
        pickup_coordinates: data.pickup_coordinates as any,
        destination_coordinates: data.destination_coordinates as any
      });

    } catch (error) {
      console.error('Erreur chargement réservation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la réservation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      if (error) throw error;
      toast({ title: 'Course annulée', description: 'Votre réservation a été annulée.' });
      onBack();
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'annuler. Réessayez.", variant: 'destructive' });
      setIsCancelling(false);
    }
  };

  const handleShare = async () => {
    if (!booking || !booking.pickup_coordinates) return;

    const shareData = {
      title: 'Ma course Tembea Taxi',
      text: `Je suis en route vers ${booking.destination}`,
      url: `https://maps.google.com/?q=${booking.pickup_coordinates.lat},${booking.pickup_coordinates.lng}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copier dans le presse-papier
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Lien copié",
          description: "Le lien de votre position a été copié"
        });
      }
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glassmorphism w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement des détails...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking || !statusConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glassmorphism w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Réservation introuvable</h3>
            <Button onClick={onBack}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEmergency = async () => {
    try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch {}
    toast({ title: 'Urgence signalée', description: 'Notre équipe a été alertée.', variant: 'destructive' });
  };

  return (
    <>
      {booking.status === 'pickup' && (
        <WaitingNotification rideRequest={{
          id: booking.id,
          vehicle_class: booking.vehicle_class || 'eco',
          driver_arrived_at: driverArrivedAt,
          status: 'driver_arrived',
          estimated_price: booking.client_proposed_price || booking.estimated_price || 0,
        }} />
      )}
      <RideTrackingScreen
        bookingId={bookingId}
        status={mapStatus(booking.status)}
        etaMinutes={realTimeEta?.etaMinutes || 10}
        progressPercent={statusConfig?.progress || 0}
        pickupLabel={booking.pickup_location}
        destinationLabel={booking.destination}
        fareAmount={(booking.actual_price || booking.final_agreed_price || booking.client_proposed_price || booking.estimated_price || 0) + waitingFee}
        driverArrivedAt={driverArrivedAt}
        fareCurrency={getCurrencyByCity(booking.city || 'Kinshasa') as 'XOF' | 'XOF'}
        driver={{
          name: booking.driver_name || 'Chauffeur',
          rating: booking.driver_rating || 0,
          photoUrl: booking.driver_photo,
          vehicle: booking.vehicle_plate ? {
            plate: booking.vehicle_plate,
            model: booking.vehicle_model || '',
            color: booking.vehicle_color || '',
          } : undefined,
        }}
        onBack={onBack}
        onCall={() => window.open('tel:' + booking.driver_phone)}
        onMessage={() => setShowChat(true)}
        onCancel={handleCancelBooking}
        onShare={handleShare}
        onEmergency={handleEmergency}
        mapSlot={<StaticMapView
          pickup={getCoordinates(booking.pickup_coordinates)}
          destination={getCoordinates(booking.destination_coordinates)}
          driverPosition={driverLocation ? { lat: driverLocation.lat, lng: driverLocation.lng, heading: driverLocation.heading } : null}
        />}
      />

      {showChat && booking.driver_id && (
        <TaxiChat
          bookingId={bookingId}
          driverId={booking.driver_id}
          onClose={() => setShowChat(false)}
        />
      )}

      {showPayment && (
        <TaxiPaymentModal
          isOpen={showPayment}
          onClose={() => { setShowPayment(false); onBack(); }}
          bookingData={{
            id: booking.id,
            pickup: { address: booking.pickup_location },
            destination: { address: booking.destination },
            actualPrice: (booking.actual_price || booking.final_agreed_price || booking.client_proposed_price || booking.estimated_price || 0) + waitingFee,
            distance: booking.distance_km || 0,
            duration: booking.estimated_duration ? `${booking.estimated_duration} min` : '—',
            driverId: booking.driver_id || '',
            driverName: booking.driver_name || 'Chauffeur',
            driverRating: booking.driver_rating || 0,
            currency: getCurrencyByCity(booking.city || 'Kinshasa'),
          }}
          onPaymentComplete={onBack}
        />
      )}
    </>
  );
}