import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ArrivalConfirmationResult {
  success: boolean;
  message?: string;
  rides_remaining?: number;
  distance_to_pickup?: number;
  error?: string;
}

export const useDriverArrivalConfirmation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const getCurrentLocation = async (): Promise<{ lat: number; lng: number }> => {
    // ✅ GPS natif via Capacitor (Android/iOS) avec fallback web
    const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
    
    const position = await nativeGeolocationService.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    
    return {
      lat: position.lat,
      lng: position.lng
    };
  };

  const confirmArrival = async (bookingId: string): Promise<ArrivalConfirmationResult> => {
    if (!user) {
      return { success: false, error: 'Non authentifié' };
    }

    setLoading(true);
    setConfirming(true);

    try {
      // Get current location
      toast.info('📍 Vérification de votre position...');
      const location = await getCurrentLocation();

      console.log('🚗 Confirming arrival at:', location);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('driver-arrival-confirmation', {
        body: {
          booking_id: bookingId,
          driver_id: user.id,
          driver_location: location
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la confirmation');
      }

      toast.success('✅ Arrivée confirmée !', {
        description: `Crédits restants: ${data.rides_remaining}`
      });

      return {
        success: true,
        message: data.message,
        rides_remaining: data.rides_remaining,
        distance_to_pickup: data.distance_to_pickup
      };

    } catch (error: any) {
      console.error('❌ Arrival confirmation error:', error);
      
      const errorMessage = error.message || 'Erreur lors de la confirmation d\'arrivée';
      toast.error(errorMessage);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return {
    confirmArrival,
    loading,
    confirming
  };
};
