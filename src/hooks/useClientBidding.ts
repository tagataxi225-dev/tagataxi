import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseClientBiddingParams {
  bookingId: string;
  estimatedPrice: number;
}

interface DriverOffer {
  offerId: string;
  driverId: string;
  driverName: string;
  offeredPrice: number;
  isCounterOffer: boolean;
  message?: string;
  estimatedArrival?: number;
  distanceToPickup?: number;
  driverRating?: number;
  driverAvatar?: string;
  driverVehicleClass?: string;
  createdAt: string;
}

export const useClientBidding = ({ bookingId, estimatedPrice }: UseClientBiddingParams) => {
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [proposedPrice, setProposedPrice] = useState<number | null>(null);
  const [biddingActive, setBiddingActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(180); // 3 minutes en secondes
  const [directAcceptDriverId, setDirectAcceptDriverId] = useState<string | null>(null);

  // Charger l'état initial depuis la DB
  useEffect(() => {
    if (!bookingId) return;
    (async () => {
      const { data } = await supabase
        .from('transport_bookings')
        .select('bidding_mode, bidding_closes_at, client_proposed_price')
        .eq('id', bookingId)
        .maybeSingle();
      if (data?.bidding_mode && data?.bidding_closes_at) {
        const closesAt = new Date(data.bidding_closes_at).getTime();
        const remaining = Math.max(0, Math.floor((closesAt - Date.now()) / 1000));
        setBiddingActive(remaining > 0);
        setTimeRemaining(remaining);
        if (data.client_proposed_price) setProposedPrice(data.client_proposed_price);
      }
    })();
  }, [bookingId]);

  // 1. Soumettre la proposition initiale du client
  const submitClientProposal = useCallback(async (clientPrice: number) => {
    setLoading(true);
    try {
      // Mettre à jour le booking avec la proposition du client
      const biddingClosesAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
      
      // Mettre à jour le booking avec la proposition du client
      const { error: updateError } = await supabase
        .from('transport_bookings')
        .update({
          client_proposed_price: clientPrice,
          bidding_mode: true,
          bidding_closes_at: biddingClosesAt,
          status: 'pending'
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Récupérer les détails du booking pour la notification
      const { data: booking } = await supabase
        .from('transport_bookings')
        .select('pickup_coordinates, vehicle_type')
        .eq('id', bookingId)
        .single();

      if (!booking) throw new Error('Booking non trouvé');

      const coords = booking.pickup_coordinates as any;

      // Notifier les chauffeurs via Edge Function
      const { data: notifResult, error: notifError } = await supabase.functions.invoke(
        'notify-drivers-bidding',
        {
          body: {
            bookingId,
            pickupLat: coords?.lat || 0,
            pickupLng: coords?.lng || 0,
            estimatedPrice,
            clientProposedPrice: clientPrice,
            vehicleType: booking.vehicle_type,
            biddingDuration: 180
          }
        }
      );

      if (notifError) throw notifError;

      console.log('✅ [ClientBidding] Proposal submitted:', {
        bookingId,
        clientPrice,
        notifiedDrivers: notifResult?.notifiedDrivers
      });

      setProposedPrice(clientPrice);
      setBiddingActive(true);
      setTimeRemaining(180);

      toast.success('🎯 Enchère lancée !', {
        description: `${notifResult?.notifiedDrivers || 0} chauffeurs notifiés`
      });

      return true;
    } catch (error) {
      console.error('❌ [ClientBidding] Error submitting proposal:', error);
      toast.error('Erreur lors du lancement de l\'enchère');
      return false;
    } finally {
      setLoading(false);
    }
  }, [bookingId, estimatedPrice]);

  // 2. Augmenter la proposition (si aucun chauffeur n'accepte)
  const increaseProposal = useCallback(async (newPrice: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({
          client_proposed_price: newPrice,
          bidding_closes_at: new Date(Date.now() + 180 * 1000).toISOString(),
          status: 'pending'
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Récupérer les détails pour re-notifier
      const { data: booking } = await supabase
        .from('transport_bookings')
        .select('pickup_coordinates, vehicle_type')
        .eq('id', bookingId)
        .single();

      if (!booking) throw new Error('Booking non trouvé');

      const coords = booking.pickup_coordinates as any;

      // Re-notifier les chauffeurs avec le nouveau prix
      await supabase.functions.invoke('notify-drivers-bidding', {
        body: {
          bookingId,
          pickupLat: coords?.lat || 0,
          pickupLng: coords?.lng || 0,
          estimatedPrice,
          clientProposedPrice: newPrice,
          vehicleType: booking.vehicle_type,
          biddingDuration: 180
        }
      });

      setProposedPrice(newPrice);
      setTimeRemaining(180);

      toast.success('💰 Offre augmentée !', {
        description: 'Les chauffeurs ont été re-notifiés'
      });

      return true;
    } catch (error) {
      console.error('❌ [ClientBidding] Error increasing proposal:', error);
      toast.error('Erreur lors de l\'augmentation de l\'offre');
      return false;
    } finally {
      setLoading(false);
    }
  }, [bookingId, estimatedPrice]);

  // 3. Accepter une contre-offre d'un chauffeur
  const acceptCounterOffer = useCallback(async (offerId: string, driverId: string) => {
    setLoading(true);
    try {
      // Marquer l'offre comme acceptée
      const { error: offerError } = await supabase
        .from('ride_offers')
        .update({ status: 'accepted' })
        .eq('id', offerId);

      if (offerError) throw offerError;

      // Récupérer le prix proposé par le chauffeur
      const { data: offerData } = await supabase
        .from('ride_offers')
        .select('offered_price')
        .eq('id', offerId)
        .maybeSingle();
      const finalPrice = (offerData as any)?.offered_price || null;

      // Assigner le chauffeur + enregistrer le prix final négocié
      const { error: bookingError } = await supabase
        .from('transport_bookings')
        .update({
          driver_id: driverId,
          assigned_driver_id: driverId,
          status: 'accepted',
          bidding_mode: false,
          driver_assigned_at: new Date().toISOString(),
          ...(finalPrice ? { final_agreed_price: finalPrice, client_proposed_price: finalPrice } : {}),
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      await supabase
        .from('push_notifications')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq('transport_booking_id', bookingId)
        .eq('user_id', driverId);
      window.dispatchEvent(new CustomEvent('ride-accepted', { detail: { bookingId } }));
      window.dispatchEvent(new CustomEvent('offer-submitted', { detail: { bookingId } }));

      toast.success('✅ Chauffeur assigné !', {
        description: 'Le chauffeur a été notifié'
      });

      setBiddingActive(false);
      return true;
    } catch (error) {
      console.error('❌ [ClientBidding] Error accepting offer:', error);
      toast.error('Erreur lors de l\'acceptation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // 4. Refuser une contre-offre
  const rejectCounterOffer = useCallback(async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('ride_offers')
        .update({ status: 'rejected' })
        .eq('id', offerId);

      if (error) throw error;

      toast.info('Contre-offre refusée');
      return true;
    } catch (error) {
      console.error('❌ [ClientBidding] Error rejecting offer:', error);
      return false;
    }
  }, []);

  // 5. Écouter les offres en temps réel - ALWAYS listen, not just when biddingActive
  useEffect(() => {
    if (!bookingId) return;

    console.log('🔔 [ClientBidding] Setting up realtime offers listener for booking:', bookingId);

    const channel = supabase
      .channel(`bidding-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_offers'
        },
        async (payload) => {
          if ((payload.new as any).booking_id !== bookingId) return;
          console.log('📩 New offer received:', payload.new);
          
          // Récupérer le nom du chauffeur
          let driverName = 'Chauffeur';
          let driverRating = 0;
          let driverAvatar = '';
          let driverVehicleClass = '';

          try {
            const { data: driverData } = await supabase
              .from('chauffeurs')
              .select('display_name, rating_average, vehicle_class, profile_photo_url')
              .eq('user_id', payload.new.driver_id)
              .maybeSingle();

            if (driverData) {
              driverName = driverData.display_name || 'Chauffeur';
              driverRating = driverData.rating_average || 0;
              driverAvatar = driverData.profile_photo_url || '';
              driverVehicleClass = driverData.vehicle_class || '';
            }
          } catch (e) {
            console.warn('Could not fetch driver info:', e);
          }
          
          const newOffer: DriverOffer = {
            offerId: payload.new.id as string,
            driverId: payload.new.driver_id as string,
            driverName,
            offeredPrice: payload.new.offered_price || 0,
            isCounterOffer: payload.new.is_counter_offer || false,
            message: payload.new.message || '',
            distanceToPickup: payload.new.distance_to_pickup,
            estimatedArrival: payload.new.estimated_arrival_time,
            driverRating,
            driverAvatar,
            driverVehicleClass,
            createdAt: payload.new.created_at || new Date().toISOString()
          };

          setOffers(prev => [...prev, newOffer]);

          toast.success('📨 Nouvelle offre reçue !', {
            description: `${driverName} propose ${newOffer.offeredPrice.toLocaleString()} CDF`
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  // 5b. Écouter l'acceptation directe d'un chauffeur (UPDATE transport_bookings)
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings'
        },
        (payload) => {
          const row = payload.new as any;
          if (row?.id !== bookingId) return;
          if (['accepted', 'driver_assigned'].includes(row?.status) && row?.driver_id) {
            setDirectAcceptDriverId(row.driver_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  // 6. Timer countdown
  useEffect(() => {
    if (!biddingActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setBiddingActive(false);
          toast.warning('⏱️ Enchère expirée', {
            description: 'Vous pouvez augmenter votre offre ou accepter le prix TAGA'
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [biddingActive, timeRemaining]);

  return {
    loading,
    offers,
    proposedPrice,
    biddingActive,
    timeRemaining,
    directAcceptDriverId,
    submitClientProposal,
    increaseProposal,
    acceptCounterOffer,
    rejectCounterOffer
  };
};
