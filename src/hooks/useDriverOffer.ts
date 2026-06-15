import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SubmitOfferParams {
  bookingId: string;
  offeredPrice: number;
  originalEstimatedPrice: number;
  message?: string;
  estimatedArrival?: number;
}

export const useDriverOffer = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const submitOffer = async (params: SubmitOfferParams): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    try {
      setSubmitting(true);

      // Vérifier que le chauffeur n'a pas déjà fait une offre
      const { data: existingOffer, error: checkError } = await supabase
        .from('ride_offers' as any)
        .select('id')
        .eq('booking_id', params.bookingId)
        .eq('driver_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingOffer) {
        toast.error('Vous avez déjà fait une offre pour cette course');
        return false;
      }

      // Obtenir la position actuelle du chauffeur
      const { data: locationData } = await supabase
        .from('driver_locations')
        .select('latitude, longitude')
        .eq('driver_id', user.id)
        .maybeSingle();

      const driverLocation = locationData 
        ? { lat: locationData.latitude, lng: locationData.longitude }
        : null;

      // Calculer la distance jusqu'au pickup (si on a les coordonnées)
      let distanceToPickup: number | undefined;
      
      if (driverLocation) {
        const { data: bookingData } = await supabase
          .from('transport_bookings')
          .select('pickup_coordinates')
          .eq('id', params.bookingId)
          .single();

        if (bookingData?.pickup_coordinates) {
          const pickup = bookingData.pickup_coordinates as any;
          // Calcul simple de distance (Haversine simplifiée)
          const R = 6371; // Rayon de la Terre en km
          const dLat = (pickup.lat - driverLocation.lat) * Math.PI / 180;
          const dLon = (pickup.lng - driverLocation.lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(driverLocation.lat * Math.PI / 180) * Math.cos(pickup.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distanceToPickup = R * c;
        }
      }

      // Créer l'offre avec les colonnes maintenant disponibles
      const offerData: Record<string, any> = {
        booking_id: params.bookingId,
        driver_id: user.id,
        offered_price: params.offeredPrice,
        original_estimated_price: params.originalEstimatedPrice,
        message: params.message,
        distance_to_pickup: distanceToPickup,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      };
      
      // Ajouter les nouveaux champs si disponibles
      if (params.estimatedArrival) {
        offerData.estimated_arrival_time = params.estimatedArrival;
      }
      if (driverLocation) {
        offerData.driver_current_location = driverLocation;
      }

      // TODO: ajouter en DB → ALTER TABLE ride_offers ADD CONSTRAINT uq_ride_offers_booking_driver UNIQUE (booking_id, driver_id);
      const { error: insertError } = await supabase
        .from('ride_offers' as any)
        .insert(offerData);

      if (insertError) throw insertError;

      // Incrémenter le compteur d'offres
      await supabase.rpc('increment_offer_count' as any, { 
        p_booking_id: params.bookingId 
      });

      toast.success('✅ Offre envoyée !', {
        description: 'Le client peut maintenant accepter votre offre'
      });
      window.dispatchEvent(new CustomEvent('offer-submitted', { detail: { bookingId: params.bookingId } }));

      return true;
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      
      if (error.message?.includes('limites acceptables')) {
        toast.error('Prix hors limites', {
          description: 'Le prix doit être entre 50% et 150% du tarif estimé'
        });
      } else {
        toast.error('Erreur lors de l\'envoi de l\'offre');
      }
      
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const withdrawOffer = async (offerId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('ride_offers' as any)
        .update({ status: 'withdrawn' })
        .eq('id', offerId)
        .eq('driver_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('Offre retirée');
      return true;
    } catch (error) {
      console.error('Error withdrawing offer:', error);
      toast.error('Erreur lors du retrait de l\'offre');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitOffer,
    withdrawOffer,
    submitting
  };
};
