import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { cityDetectionService } from '@/services/cityDetectionService';

interface BookingData {
  pickupLocation: string;
  destination: string;
  pickupCoordinates?: { lat: number; lng: number };
  destinationCoordinates?: { lat: number; lng: number };
  vehicleType: string;
  estimatedPrice: number;
  pickupTime?: string;
  city?: string; // Ville de la réservation
}

export const useTransportBooking = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createBooking = async (data: BookingData) => {
    if (!user) {
      toast.error('Vous devez être connecté pour réserver');
      return null;
    }

    setLoading(true);
    try {
      // Détecter intelligemment la ville
      const cityDetection = cityDetectionService.detectCity({
        coordinates: data.pickupCoordinates,
        address: data.pickupLocation,
        userSelection: data.city
      });

      console.log('🏙️ [Transport] Ville détectée:', cityDetection.city.name, 'Confiance:', cityDetection.confidence);

      const { data: booking, error } = await supabase
        .from('transport_bookings')
        .insert({
          user_id: user.id,
          pickup_location: data.pickupLocation,
          destination: data.destination,
          pickup_coordinates: data.pickupCoordinates,
          destination_coordinates: data.destinationCoordinates,
          vehicle_type: data.vehicleType,
          estimated_price: data.estimatedPrice,
          pickup_time: data.pickupTime || new Date().toISOString(),
          city: cityDetection.city.name, // Ville détectée intelligemment
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Réservation créée avec succès');
      return booking;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Erreur lors de la réservation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserBookings = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast.error('Erreur lors du chargement des réservations');
      return [];
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;
      
      toast.success('Statut mis à jour');
      return true;
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  };

  const processPayment = async (bookingId: string, paymentMethod: 'wallet' | 'mobile_money', paymentData?: any) => {
    if (!user) return false;

    try {
      if (paymentMethod === 'mobile_money') {
        const { data, error } = await supabase.functions.invoke('mobile-money-payment', {
          body: {
            amount: paymentData.amount,
            provider: paymentData.provider,
            phoneNumber: paymentData.phoneNumber,
            currency: 'CDF',
            orderId: bookingId,
            orderType: 'transport'
          }
        });

        if (error) throw error;
        
        if (data.success) {
          await updateBookingStatus(bookingId, 'paid');
          return true;
        }
      } else if (paymentMethod === 'wallet') {
        // Process wallet commission
        const booking = await supabase
          .from('transport_bookings')
          .select('*, driver_id, estimated_price')
          .eq('id', bookingId)
          .single();

        if (booking.data?.driver_id) {
          const { data, error } = await supabase.functions.invoke('wallet-commission', {
            body: {
              booking_id: bookingId,
              amount: booking.data.estimated_price,
              service_type: 'transport',
              driver_id: booking.data.driver_id,
              user_id: user.id
            }
          });

          if (error) throw error;
          
          if (data.success) {
            return true;
          }
        }
      }

      return false;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Erreur lors du paiement');
      return false;
    }
  };

  return {
    loading,
    createBooking,
    getUserBookings,
    updateBookingStatus,
    processPayment
  };
};