import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { callEdgeFunction } from '@/utils/edgeFunctionConfig';
import { getVehicleClass } from '@/utils/pricingMapper';
import { logger } from '@/utils/logger';
import { isCityCovered } from '@/config/coveredCities';

interface BookingData {
  pickupLocation: string;
  destination: string;
  pickupCoordinates: { lat: number; lng: number };
  destinationCoordinates: { lat: number; lng: number };
  vehicleType: string;
  estimatedPrice: number;
  city?: string;
  pickupTime?: string;
}

interface CreateRideOptions {
  biddingMode?: boolean;
  clientProposedPrice?: number;
  biddingDuration?: number;
}

interface SearchProgress {
  radius: number;
  driversFound: number;
  status: 'idle' | 'searching' | 'found' | 'failed';
}

interface AssignedDriver {
  driver_id: string;
  distance_km: number;
  score: number;
  driver_name?: string;
  driver_avatar?: string;
  driver_phone?: string;
  rating_average?: number;
  total_rides?: number;
  vehicle_plate?: string;
  vehicle_model?: string;
  vehicle_make?: string;
  vehicle_color?: string;
}

type DispatchErrorCategory = 'auth' | 'network' | 'no_drivers' | 'dispatch_error' | 'unknown';

export interface RideDispatchResult {
  success: boolean;
  booking?: any;
  driver?: AssignedDriver;
  biddingActive?: boolean;
  notifiedDrivers?: number;
  message?: string;
  reason?: 'not_authenticated' | 'missing_data' | 'no_drivers' | 'no_coverage' | 'error';
  errorCategory?: DispatchErrorCategory;
}

function classifyError(error: any): { category: DispatchErrorCategory; userMessage: string } {
  const msg = (error?.message || '').toLowerCase();
  
  if (msg.includes('auth') || msg.includes('jwt') || msg.includes('token') || msg.includes('not authenticated')) {
    return { category: 'auth', userMessage: 'Session expirée. Veuillez vous reconnecter.' };
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') || msg.includes('abort') || msg.includes('failed to fetch') || msg.includes('load failed')) {
    return { category: 'network', userMessage: 'Problème de connexion. Vérifiez votre internet et réessayez.' };
  }
  if (msg.includes('no driver') || msg.includes('aucun chauffeur') || msg.includes('no_drivers')) {
    return { category: 'no_drivers', userMessage: 'Aucun chauffeur disponible. Essayez un autre type de véhicule ou réessayez dans quelques minutes.' };
  }
  return { category: 'dispatch_error', userMessage: error?.message || 'Erreur lors de la réservation. Veuillez réessayer.' };
}

export const useRideDispatch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [assignedDriver, setAssignedDriver] = useState<AssignedDriver | null>(null);
  const [searchProgress, setSearchProgress] = useState<SearchProgress>({
    radius: 5, driversFound: 0, status: 'idle'
  });
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const lastBookingRef = useRef<{ booking: any; bookingData: BookingData } | null>(null);
  const isDispatchingRef = useRef(false);
  const channelRef = useRef<any>(null);
  const keepSearchingRef = useRef(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createAndDispatchRide = async (
    bookingData: BookingData, 
    options: CreateRideOptions = {}
  ): Promise<RideDispatchResult> => {
    if (isDispatchingRef.current) {
      logger.warn('⚠️ [RideDispatch] Already dispatching, ignoring duplicate call');
      return { success: false, reason: 'error', message: 'Dispatch déjà en cours' };
    }

    try {
      isDispatchingRef.current = true;
      keepSearchingRef.current = false;
      setIsSearching(true);
      setSearchProgress({ radius: 10, driversFound: 0, status: 'searching' });
      
      const { biddingMode = false, clientProposedPrice, biddingDuration = 180 } = options;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('⚠️ [RideDispatch] User not authenticated');
        return { success: false, reason: 'not_authenticated', errorCategory: 'auth', message: 'Connexion requise pour réserver' };
      }

      if (
        bookingData.pickupCoordinates.lat === bookingData.destinationCoordinates.lat &&
        bookingData.pickupCoordinates.lng === bookingData.destinationCoordinates.lng
      ) {
        return {
          success: false,
          reason: 'missing_data',
          message: 'Le point de départ et la destination doivent être différents.'
        };
      }

      const resolvedCity = bookingData.city || 'unknown';
      logger.info('🚗 [RideDispatch] Creating booking...', {
        pickup: bookingData.pickupLocation,
        destination: bookingData.destination,
        vehicleType: bookingData.vehicleType,
        city: resolvedCity,
        biddingMode
      });

      // 1. Create booking
      const bookingInsert = {
        user_id: user.id,
        pickup_location: bookingData.pickupLocation,
        destination: bookingData.destination,
        pickup_coordinates: {
          lat: bookingData.pickupCoordinates.lat,
          lng: bookingData.pickupCoordinates.lng
        },
        destination_coordinates: {
          lat: bookingData.destinationCoordinates.lat,
          lng: bookingData.destinationCoordinates.lng
        },
        vehicle_type: bookingData.vehicleType,
        estimated_price: bookingData.estimatedPrice,
        city: resolvedCity,
        pickup_time: bookingData.pickupTime || new Date().toISOString(),
        // TODO: ajouter 'bidding' dans la contrainte DB transport_bookings_status_check
        status: 'pending',
        bidding_mode: biddingMode,
        bidding_closes_at: biddingMode ? new Date(Date.now() + biddingDuration * 1000).toISOString() : null,
        client_proposed_price: biddingMode ? (clientProposedPrice || Math.floor(bookingData.estimatedPrice * 0.8)) : null
      };

      const { data: booking, error: bookingError } = await supabase
        .from('transport_bookings')
        .insert([bookingInsert])
        .select()
        .single();

      if (bookingError) throw bookingError;

      logger.info('✅ [RideDispatch] Booking created:', booking.id);
      setActiveBookingId(booking.id);
      lastBookingRef.current = { booking, bookingData };

      // 2. Bidding mode
      if (biddingMode) {
        try {
          const mappedClass = getVehicleClass(bookingData.vehicleType);
          const biddingResult = await callEdgeFunction('notify-drivers-bidding', {
            bookingId: booking.id,
            pickupLat: bookingData.pickupCoordinates.lat,
            pickupLng: bookingData.pickupCoordinates.lng,
            estimatedPrice: bookingData.estimatedPrice,
            clientProposedPrice: clientProposedPrice || Math.floor(bookingData.estimatedPrice * 0.8),
            serviceType: 'taxi',
            vehicleClass: mappedClass,
            biddingDuration,
            city: bookingData.city || 'Kinshasa'
          });

          const notified = biddingResult.notifiedDrivers || 0;

          if (notified === 0) {
            // Aucun chauffeur notifié → pas de drivers dispo, ne jamais afficher "trouvé"
            setSearchProgress({ radius: 15, driversFound: 0, status: 'failed' });
            return {
              success: false, booking, reason: 'no_drivers' as const,
              message: 'Aucun chauffeur disponible pour le moment.'
            };
          }

          // Drivers notifiés mais pas encore accepté → rester en "searching"
          // keepSearchingRef évite que le finally ferme isSearching
          keepSearchingRef.current = true;
          setSearchProgress({ radius: 15, driversFound: notified, status: 'searching' });

          return {
            success: true, booking, biddingActive: true,
            notifiedDrivers: notified,
            message: `${notified} chauffeurs notifiés.`
          };
        } catch (error) {
          logger.error('❌ [RideDispatch] Bidding error:', error);
          toast.error('Erreur mode enchères, passage en mode classique');
          await supabase.from('transport_bookings').update({ status: 'pending', bidding_mode: false }).eq('id', booking.id);
        }
      }

      // 3. Classic dispatch with retry
      const dispatchResult = await dispatchWithRetry(booking, bookingData, 1);

      if (dispatchResult.success && dispatchResult.driver) {
        // Handle both old and new driver response formats
        const raw = dispatchResult.driver;
        const mappedDriver: AssignedDriver = {
          driver_id: raw.driver_id || raw.id,
          distance_km: raw.distance_km ?? raw.distance ?? 0,
          score: raw.score || 0,
          driver_name: raw.display_name || raw.driver_name,
          driver_avatar: raw.profile_photo_url || raw.driver_avatar,
          driver_phone: raw.phone_number || raw.driver_phone,
          rating_average: raw.rating_average ?? raw.rating,
          total_rides: raw.total_rides || 0,
          vehicle_plate: raw.vehicle_plate,
          vehicle_model: raw.vehicle_model,
          vehicle_make: raw.vehicle_make,
          vehicle_color: raw.vehicle_color,
        };
        // ⚠️ Ne PAS basculer en 'found' ici — la RPC dispatch a juste notifié un
        // chauffeur (booking.status = 'driver_assigned'). Le client doit attendre
        // que le chauffeur ACCEPTE (status = 'accepted'). Le listener realtime
        // (listenForDriverAssignment) gère la bascule quand le statut DB change.
        setSearchProgress({ radius: 10, driversFound: 1, status: 'searching' });
        setAssignedDriver(mappedDriver);
        listenForDriverAssignment(booking.id);
        return { success: true, booking, driver: mappedDriver, message: `Chauffeur notifié à ${mappedDriver.distance_km?.toFixed(1) || '~'}km — attente acceptation` };
      } else {
        setSearchProgress(prev => ({ ...prev, status: 'failed' }));
        const cityName = bookingData.city || 'unknown';
        if (!isCityCovered(cityName)) {
          return {
            success: false, booking, reason: 'no_coverage', errorCategory: 'no_drivers',
            message: `Service non disponible dans votre zone. TAGA arrive bientôt à ${cityName} !`
          };
        }
        return {
          success: false, booking, reason: 'no_drivers', errorCategory: 'no_drivers',
          message: dispatchResult.message || 'Aucun chauffeur disponible pour le moment, réessayez dans quelques minutes.'
        };
      }
    } catch (error: any) {
      logger.error('❌ [RideDispatch] Error:', error);
      const classified = classifyError(error);
      setSearchProgress(prev => ({ ...prev, status: 'failed' }));
      return { success: false, reason: 'error', errorCategory: classified.category, message: classified.userMessage };
    } finally {
      if (!keepSearchingRef.current) {
        setIsSearching(false);
      }
      isDispatchingRef.current = false;
    }
  };

  const listenForDriverAssignment = (bookingId: string) => {
    logger.info('👂 [RideDispatch] Listening for driver assignment on booking:', bookingId);
    setIsSearching(true);
    setSearchProgress({ radius: 10, driversFound: 0, status: 'searching' });

    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    if (searchTimeoutRef.current) { clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = null; }

    // 30s hard timeout — never leave the client in an infinite searching loop
    searchTimeoutRef.current = setTimeout(() => {
      searchTimeoutRef.current = null;
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
      setIsSearching(false);
      setSearchProgress(prev =>
        prev.status === 'searching' ? { ...prev, status: 'failed' } : prev
      );
      logger.warn('⏱️ [RideDispatch] 30s timeout — no driver assigned, showing failed state');
    }, 30000);

    const channel = supabase
      .channel(`booking-status-${bookingId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'transport_bookings'
        // No filter= : unstable on Supabase Realtime. Client-side filter below.
      }, async (payload) => {
        if ((payload.new as any).id !== bookingId) return; // client-side filter
        if (payload.new.status === 'cancelled') {
          // Booking cancelled externally — clean up silently
          if (searchTimeoutRef.current) { clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = null; }
          return;
        }
        if (payload.new.driver_id && ['accepted', 'driver_assigned'].includes(payload.new.status as string)) {
          if (searchTimeoutRef.current) { clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = null; }

          const { data: driverProfile } = await supabase
            .from('chauffeurs')
            .select('*')
            .eq('user_id', payload.new.driver_id)
            .maybeSingle();

          const dp = driverProfile as any;
          const driver: AssignedDriver = {
            driver_id: payload.new.driver_id,
            distance_km: 0, score: 0,
            ...(dp ? {
              driver_name: dp.display_name,
              driver_avatar: dp.profile_photo_url,
              driver_phone: dp.phone_number,
              rating_average: dp.rating_average,
              total_rides: dp.total_rides,
              vehicle_plate: dp.vehicle_plate,
              vehicle_model: dp.vehicle_model,
              vehicle_make: dp.vehicle_make,
              vehicle_color: dp.vehicle_color,
            } : {})
          };

          setAssignedDriver(driver);
          setSearchProgress(prev => ({ ...prev, status: 'found' }));
          setIsSearching(false);
          toast.success('🎉 Chauffeur a accepté !', {
            description: driver.driver_name || 'Votre chauffeur arrive'
          });
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (searchTimeoutRef.current) { clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = null; }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  };

  const dispatchWithRetry = async (booking: any, bookingData: BookingData, attempt: number = 1): Promise<any> => {
    const maxAttempts = 3;
    const radius = 10 + (attempt - 1) * 10;
    const priority = attempt >= 2 ? 'high' : 'normal';

    try {
      const mappedVehicleClass = getVehicleClass(bookingData.vehicleType);
      logger.info('🚗 [RideDispatch] Dispatch attempt', { attempt, radius, vehicleClass: mappedVehicleClass });

      const { data: result, error: invokeError } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          bookingId: booking.id,
          pickupLat: bookingData.pickupCoordinates.lat,
          pickupLng: bookingData.pickupCoordinates.lng,
          serviceType: 'taxi',
          vehicleClass: mappedVehicleClass,
          city: bookingData.city || 'unknown',
          searchRadius: radius, priority
        }
      });

      if (invokeError) throw invokeError;

      if (result.success || attempt >= maxAttempts) return result;

      setSearchProgress({ radius, driversFound: result.driversFound || 0, status: 'searching' });
      
      // Exponential backoff: 2s, 4s, 8s
      const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return await dispatchWithRetry(booking, bookingData, attempt + 1);
    } catch (error: any) {
      const classified = classifyError(error);
      logger.error('❌ [RideDispatch] Dispatch attempt failed:', { attempt, category: classified.category, message: error.message });

      // Auth/network errors won't resolve by retrying
      if (classified.category === 'auth' || classified.category === 'network') {
        throw error;
      }
      
      if (attempt >= maxAttempts) throw error;
      
      const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return await dispatchWithRetry(booking, bookingData, attempt + 1);
    }
  };

  const resetSearch = () => {
    if (searchTimeoutRef.current) { clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = null; }
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    setIsSearching(false);
    setAssignedDriver(null);
    setSearchProgress({ radius: 5, driversFound: 0, status: 'idle' });
    setActiveBookingId(null);
    setRetryCount(0);
    lastBookingRef.current = null;
    isDispatchingRef.current = false;
    keepSearchingRef.current = false;
  };

  const cancelBooking = async (bookingId: string): Promise<boolean> => {
    // Kill timer + listener immediately — prevents race where dispatcher
    // assigns a driver between the user tapping Cancel and channel teardown.
    if (searchTimeoutRef.current) { clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = null; }
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      if (error) throw error;
      resetSearch();
      return true;
    } catch (error: any) {
      logger.error('❌ [RideDispatch] Cancel booking error:', error);
      resetSearch();
      return false;
    }
  };

  const retryDispatch = useCallback(async () => {
    if (!lastBookingRef.current) return;
    const { booking, bookingData } = lastBookingRef.current;
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    setIsSearching(true);
    isDispatchingRef.current = true;
    const newRadius = 30 + newRetryCount * 10;
    setSearchProgress({ radius: newRadius, driversFound: 0, status: 'searching' });

    try {
      const result = await dispatchWithRetry(booking, bookingData, 1);
      if (result.success && result.driver) {
        const raw = result.driver;
        const mappedDriver: AssignedDriver = {
          driver_id: raw.driver_id || raw.id,
          distance_km: raw.distance_km ?? raw.distance ?? 0,
          score: raw.score || 0,
          driver_name: raw.display_name || raw.driver_name,
          driver_avatar: raw.profile_photo_url || raw.driver_avatar,
          driver_phone: raw.phone_number || raw.driver_phone,
          rating_average: raw.rating_average ?? raw.rating,
          total_rides: raw.total_rides || 0,
          vehicle_plate: raw.vehicle_plate,
          vehicle_model: raw.vehicle_model,
          vehicle_make: raw.vehicle_make,
          vehicle_color: raw.vehicle_color,
        };
        setSearchProgress({ radius: newRadius, driversFound: 1, status: 'found' });
        setAssignedDriver(mappedDriver);
      } else {
        setSearchProgress(prev => ({ ...prev, status: 'failed' }));
      }
    } catch {
      setSearchProgress(prev => ({ ...prev, status: 'failed' }));
    } finally {
      setIsSearching(false);
      isDispatchingRef.current = false;
    }
  }, [retryCount]);

  return {
    isSearching, assignedDriver, searchProgress, activeBookingId,
    retryCount, createAndDispatchRide, listenForDriverAssignment,
    resetSearch, retryDispatch, cancelBooking
  };
};
