import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTransportBooking } from './useTransportBooking';
import { toast } from 'sonner';

interface BookingStatus {
  id: string;
  status: string;
  driver_id?: string;
  pickup_location: string;
  destination: string;
  estimated_price: number;
  actual_price?: number;
  created_at: string;
  driver_name?: string;
  driver_rating?: number;
}

export const useClientBookings = () => {
  const [loading, setLoading] = useState(false);
  const [activeBooking, setActiveBooking] = useState<BookingStatus | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingStatus[]>([]);
  const { user } = useAuth();
  const { createBooking, processPayment } = useTransportBooking();

  // Listen for booking status updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('client-bookings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedBooking = payload.new as any;
          if (updatedBooking.status === 'accepted') {
            toast.success('Votre course a été acceptée !');
            loadActiveBooking();
          } else if (updatedBooking.status === 'driver_arrived') {
            toast.info('Votre chauffeur est arrivé');
            loadActiveBooking();
          } else if (updatedBooking.status === 'completed') {
            toast.success('Course terminée avec succès');
            setActiveBooking(null);
            loadBookingHistory();
          } else if (updatedBooking.status === 'cancelled') {
            toast.error('Course annulée');
            setActiveBooking(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load active booking
  const loadActiveBooking = async () => {
    if (!user) return;

    try {
      const { data: booking, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'accepted', 'driver_arrived', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (booking) {
        setActiveBooking({
          id: booking.id,
          status: booking.status,
          driver_id: booking.driver_id,
          pickup_location: booking.pickup_location,
          destination: booking.destination,
          estimated_price: booking.estimated_price || 0,
          actual_price: booking.actual_price,
          created_at: booking.created_at,
          driver_name: 'Chauffeur', // Would get from profiles
          driver_rating: 4.8
        });
      } else {
        setActiveBooking(null);
      }

    } catch (error: any) {
      console.error('Error loading active booking:', error);
    }
  };

  // Load booking history with pagination support
  const loadBookingHistory = async (page: number = 1, pageSize: number = 20) => {
    if (!user) return;

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: bookings, error, count } = await supabase
        .from('transport_bookings')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completion_time', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const formattedHistory = bookings?.map(booking => ({
        id: booking.id,
        status: booking.status,
        driver_id: booking.driver_id,
        pickup_location: booking.pickup_location,
        destination: booking.destination,
        estimated_price: booking.estimated_price || 0,
        actual_price: booking.actual_price || 0,
        created_at: booking.created_at,
        driver_name: 'Chauffeur',
        driver_rating: 4.8
      })) || [];

      setBookingHistory(formattedHistory);

      // Return pagination info for UI
      return {
        data: formattedHistory,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };

    } catch (error: any) {
      console.error('Error loading booking history:', error);
      return { data: [], totalCount: 0, totalPages: 0 };
    }
  };

  // Create new booking
  const createNewBooking = async (bookingData: {
    pickupLocation: string;
    destination: string;
    pickupCoordinates?: { lat: number; lng: number };
    destinationCoordinates?: { lat: number; lng: number };
    vehicleType: string;
    estimatedPrice: number;
  }) => {
    setLoading(true);
    try {
      const booking = await createBooking(bookingData);
      if (booking) {
        setActiveBooking({
          id: booking.id,
          status: booking.status,
          pickup_location: booking.pickup_location,
          destination: booking.destination,
          estimated_price: booking.estimated_price || 0,
          created_at: booking.created_at
        });
        toast.success('Recherche de chauffeur en cours...');
        return booking;
      }
      return null;
    } catch (error) {
      toast.error('Erreur lors de la création de la réservation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cancel booking with reason and financial impact
  const cancelBooking = async (bookingId: string, reason: string) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return { success: false, shouldShowRebookPrompt: false };
    }

    setLoading(true);
    try {
      // Get current booking to check status and calculate fees
      const { data: booking, error: fetchError } = await supabase
        .from('transport_bookings')
        .select('status, estimated_price, driver_id')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      const cancellationFee = (booking.status === 'accepted' || booking.status === 'driver_assigned') 
        ? Math.round((booking.estimated_price || 0) * 0.1)
        : 0;

      // Update booking status
      const { error } = await supabase
        .from('transport_bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason,
          cancellation_type: 'client',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Log cancellation history
      const { error: logError } = await supabase
        .from('cancellation_history')
        .insert({
          reference_id: bookingId,
          reference_type: 'transport_booking',
          cancelled_by: user.id,
          cancellation_type: 'client',
          reason,
          status_at_cancellation: booking.status,
          financial_impact: {
            cancellation_fee: cancellationFee,
            original_amount: booking.estimated_price,
            currency: 'CDF'
          }
        });

      if (logError) console.error('Error logging cancellation:', logError);

      // Apply cancellation fee if applicable
      if (cancellationFee > 0) {
        toast.warning(`Frais d'annulation: ${cancellationFee} CDF`);
      }

      setActiveBooking(null);
      toast.success('Course annulée');
      
      return {
        success: true,
        shouldShowRebookPrompt: true
      };

    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error('Erreur lors de l\'annulation');
      return {
        success: false,
        shouldShowRebookPrompt: false
      };
    } finally {
      setLoading(false);
    }
  };

  // Process payment for booking
  const payForBooking = async (bookingId: string, paymentMethod: 'wallet' | 'mobile_money', paymentData?: any) => {
    setLoading(true);
    try {
      const success = await processPayment(bookingId, paymentMethod, paymentData);
      if (success) {
        toast.success('Paiement effectué avec succès');
        loadActiveBooking();
      }
      return success;
    } catch (error) {
      toast.error('Erreur lors du paiement');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadActiveBooking();
      loadBookingHistory();
    }
  }, [user]);

  return {
    loading,
    activeBooking,
    bookingHistory,
    createNewBooking,
    cancelBooking,
    payForBooking,
    loadActiveBooking,
    loadBookingHistory
  };
};