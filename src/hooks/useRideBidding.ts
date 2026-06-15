import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export interface RideOffer {
  id: string;
  booking_id: string;
  driver_id: string;
  offered_price: number;
  original_estimated_price: number;
  message?: string;
  estimated_arrival_time?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
  created_at: string;
  expires_at: string;
  distance_to_pickup?: number;
  driver?: {
    display_name: string;
    rating_average: number;
    vehicle_model: string;
    vehicle_plate_number: string;
    photo_url?: string;
    completed_rides?: number;
  };
}

interface UseRideBiddingParams {
  bookingId: string;
  estimatedPrice: number;
  enabled?: boolean;
}

export const useRideBidding = ({ bookingId, estimatedPrice, enabled = false }: UseRideBiddingParams) => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<RideOffer[]>([]);
  const [biddingActive, setBiddingActive] = useState(enabled);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [loading, setLoading] = useState(false);

  // Activer le mode bidding
  const enableBidding = useCallback(async (maxBudget?: number) => {
    if (!bookingId) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('transport_bookings')
        .update({
          bidding_mode: true,
          bidding_closes_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
          client_proposed_price: maxBudget
        } as any)
        .eq('id', bookingId);

      if (error) throw error;

      setBiddingActive(true);
      toast.success('Mode enchères activé', {
        description: 'Les chauffeurs peuvent maintenant faire des offres'
      });
    } catch (error) {
      console.error('Error enabling bidding:', error);
      toast.error('Erreur lors de l\'activation du mode enchères');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Charger les offres existantes
  const loadOffers = useCallback(async () => {
    if (!bookingId) return;

    try {
      const { data: offersData, error } = await supabase
        .from('ride_offers' as any)
        .select('*')
        .eq('booking_id', bookingId)
        .in('status', ['pending', 'accepted'])
        .order('offered_price', { ascending: true }) as any;

      if (error) throw error;

      if (offersData && offersData.length > 0) {
        // Charger les infos des chauffeurs
        const driverIds = offersData.map(o => o.driver_id);
        const { data: driversData } = await supabase
          .from('driver_profiles')
          .select('user_id, rating_average, vehicle_model, vehicle_plate, profile_photo_url')
          .in('user_id', driverIds);
        
        // Charger les noms depuis profiles
        const { data: profilesData } = await supabase
          .from('profiles' as any)
          .select('id, display_name')
          .in('id', driverIds);

        // Compter les courses complétées par chauffeur
        const { data: ridesData } = await supabase
          .from('transport_bookings')
          .select('driver_id')
          .in('driver_id', driverIds)
          .eq('status', 'completed');

        const ridesCounts = ridesData?.reduce((acc, ride) => {
          acc[ride.driver_id] = (acc[ride.driver_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const offersWithDrivers = offersData.map((offer: any) => {
          const driverProfile = (driversData as any)?.find((d: any) => d.user_id === offer.driver_id);
          const profile = (profilesData as any)?.find((p: any) => p.id === offer.driver_id);
          
          return {
            ...offer,
            driver: driverProfile ? {
              display_name: profile?.display_name || 'Chauffeur',
              rating_average: driverProfile.rating_average || 0,
              vehicle_model: driverProfile.vehicle_model,
              vehicle_plate_number: driverProfile.vehicle_plate,
              photo_url: driverProfile.profile_photo_url,
              completed_rides: ridesCounts[offer.driver_id] || 0
            } : undefined
          };
        });

        setOffers(offersWithDrivers as any);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  }, [bookingId]);

  // Écouter les nouvelles offres en temps réel
  useEffect(() => {
    if (!biddingActive || !bookingId) return;

    loadOffers();

    const channel = supabase
      .channel(`ride-bidding-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_offers'
        },
        async (payload) => {
          const newOffer = payload.new as any;
          if (newOffer.booking_id !== bookingId) return;

          // Charger infos chauffeur
          const { data: driverData } = await supabase
            .from('driver_profiles')
            .select('user_id, rating_average, vehicle_model, vehicle_plate, profile_photo_url')
            .eq('user_id', newOffer.driver_id)
            .single();
          
          const { data: profileData } = await supabase
            .from('profiles' as any)
            .select('display_name')
            .eq('id', newOffer.driver_id)
            .maybeSingle();

          // Compter courses complétées
          const { count } = await supabase
            .from('transport_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', newOffer.driver_id)
            .eq('status', 'completed');

          const offerWithDriver = {
            ...newOffer,
            driver: driverData ? {
              display_name: (profileData as any)?.display_name || 'Chauffeur',
              rating_average: driverData.rating_average || 0,
              vehicle_model: driverData.vehicle_model,
              vehicle_plate_number: driverData.vehicle_plate,
              photo_url: driverData.profile_photo_url,
              completed_rides: count || 0
            } : undefined
          };

          setOffers(prev => {
            const exists = prev.find(o => o.id === newOffer.id);
            if (exists) return prev;
            
            const updated = [...prev, offerWithDriver].sort((a, b) => 
              a.offered_price - b.offered_price
            );
            
            return updated;
          });

          // Notification sonore et visuelle
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }

          toast.success('🚗 Nouvelle offre reçue !', {
            description: `${(profileData as any)?.display_name || 'Un chauffeur'} propose ${newOffer.offered_price.toLocaleString()} CDF`,
            duration: 10000
          });
        }
      )
      .subscribe();

    // Timer pour le compte à rebours
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setBiddingActive(false);
          toast.info('Période d\'enchères terminée', {
            description: 'Vous pouvez maintenant accepter une offre'
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timerInterval);
    };
  }, [bookingId, biddingActive, loadOffers]);

  // Accepter une offre
  const acceptOffer = useCallback(async (offerId: string) => {
    if (!offerId) return;

    try {
      setLoading(true);

      // Marquer l'offre comme acceptée
      const { error: offerError } = await supabase
        .from('ride_offers')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', offerId);

      if (offerError) throw offerError;

      const offer = offers.find(o => o.id === offerId);
      if (!offer) throw new Error('Offre non trouvée');

      // Mettre à jour la réservation
      const { error: bookingError } = await supabase
        .from('transport_bookings')
        .update({
          driver_id: offer.driver_id,
          final_agreed_price: offer.offered_price,
          client_proposed_price: offer.offered_price,
          status: 'accepted',
          driver_assigned_at: new Date().toISOString()
        } as any)
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Rejeter toutes les autres offres
      await supabase
        .from('ride_offers' as any)
        .update({ status: 'rejected', rejected_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .neq('id', offerId)
        .eq('status', 'pending');

      // Notification de succès avec confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success('✅ Offre acceptée !', {
        description: `${offer.driver?.display_name || 'Le chauffeur'} arrive bientôt`
      });

      setBiddingActive(false);
      
      return true;
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Erreur lors de l\'acceptation de l\'offre');
      return false;
    } finally {
      setLoading(false);
    }
  }, [bookingId, offers]);

  // Accepter le tarif estimé (sans bidding)
  const acceptEstimatedPrice = useCallback(async () => {
    if (!bookingId) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('transport_bookings')
        .update({
          bidding_mode: false,
          final_agreed_price: estimatedPrice
        } as any)
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Tarif accepté', {
        description: 'Recherche d\'un chauffeur en cours...'
      });

      return true;
    } catch (error) {
      console.error('Error accepting estimated price:', error);
      toast.error('Erreur lors de l\'acceptation du tarif');
      return false;
    } finally {
      setLoading(false);
    }
  }, [bookingId, estimatedPrice]);

  // Calculer la meilleure offre
  const bestOffer = offers.length > 0 
    ? offers.reduce((best, current) => 
        current.offered_price < best.offered_price ? current : best
      )
    : null;

  return {
    offers,
    biddingActive,
    timeRemaining,
    loading,
    bestOffer,
    enableBidding,
    acceptOffer,
    acceptEstimatedPrice,
    refreshOffers: loadOffers
  };
};
