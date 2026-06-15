import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtimeTracking } from './useRealtimeTracking';
import { toast } from 'sonner';

interface ActiveBooking {
  id: string;
  user_id: string;
  pickup_location: string;
  destination: string;
  pickup_coordinates?: { lat: number; lng: number };
  destination_coordinates?: { lat: number; lng: number };
  estimated_price: number;
  status: string;
  user_name?: string;
  user_rating?: number;
}

export const useDriverBookings = () => {
  const [loading, setLoading] = useState(false);
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ActiveBooking[]>([]);
  const { user } = useAuth();
  const { startTracking, stopTracking, currentLocation } = useRealtimeTracking();

  // Listen for new booking requests
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('driver-bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transport_bookings',
          filter: `status=eq.pending`
        },
        () => {
          // In a real app, we'd have driver matching logic
          // For now, show all pending requests
          loadPendingRequests();
          toast.info('Nouvelle demande de course disponible');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings',
          filter: `driver_id=eq.${user.id}`
        },
        (payload) => {
          const updatedBooking = payload.new as any;
          if (updatedBooking.status === 'cancelled') {
            setActiveBooking(null);
            stopTracking();
            toast.info('Course annulée par le client');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load pending booking requests
  const loadPendingRequests = async () => {
    if (!user) return;

    try {
      const { data: bookings, error } = await supabase
        .from('transport_bookings')
        .select(`
          id,
          user_id,
          pickup_location,
          destination,
          pickup_coordinates,
          destination_coordinates,
          estimated_price,
          status
        `)
        .eq('status', 'pending')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: true })
        .limit(5);

      if (error) throw error;

      const formattedRequests = bookings?.map(booking => ({
        id: booking.id,
        user_id: booking.user_id,
        pickup_location: booking.pickup_location,
        destination: booking.destination,
        pickup_coordinates: booking.pickup_coordinates as { lat: number; lng: number } | undefined,
        destination_coordinates: booking.destination_coordinates as { lat: number; lng: number } | undefined,
        estimated_price: booking.estimated_price || 0,
        status: booking.status,
        user_name: 'Client',
        user_rating: 4.8 // Would get real rating
      })) || [];

      setPendingRequests(formattedRequests);

    } catch (error: any) {
      console.error('Error loading pending requests:', error);
    }
  };

  // Accept a booking request
  const acceptBooking = async (bookingId: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({ 
          driver_id: user.id, 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      const { data: booking, error: fetchError } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      const activeBookingData = {
        id: booking.id,
        user_id: booking.user_id,
        pickup_location: booking.pickup_location,
        destination: booking.destination,
        pickup_coordinates: booking.pickup_coordinates as { lat: number; lng: number } | undefined,
        destination_coordinates: booking.destination_coordinates as { lat: number; lng: number } | undefined,
        estimated_price: booking.estimated_price || 0,
        status: booking.status,
        user_name: 'Client',
        user_rating: 4.8
      };

      setActiveBooking(activeBookingData);
      
      // Démarrer le tracking du chauffeur
      startTracking({
        updateInterval: 10000,
        highAccuracy: true
      });

      setPendingRequests(prev => prev.filter(req => req.id !== bookingId));
      
      toast.success('Course acceptée');
      return true;

    } catch (error: any) {
      console.error('Error accepting booking:', error);
      toast.error('Erreur lors de l\'acceptation de la course');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cancel booking as driver with reason
  const cancelDriverBooking = async (bookingId: string, reason: string) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    setLoading(true);
    try {
      // Get current booking status
      const { data: booking, error: fetchError } = await supabase
        .from('transport_bookings')
        .select('status, estimated_price')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Update booking status
      const { error } = await supabase
        .from('transport_bookings')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason,
          cancellation_type: 'driver',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Log cancellation with driver penalty info
      const { error: logError } = await supabase
        .from('cancellation_history')
        .insert({
          reference_id: bookingId,
          reference_type: 'transport_booking',
          cancelled_by: user.id,
          cancellation_type: 'driver',
          reason,
          status_at_cancellation: booking.status,
          metadata: {
            affects_reliability: booking.status === 'accepted',
            reliability_impact: -5
          }
        });

      if (logError) console.error('Error logging cancellation:', logError);

      setActiveBooking(null);
      stopTracking();

      if (booking.status === 'accepted') {
        toast.warning('⚠️ Cette annulation affecte votre taux de fiabilité');
      }

      toast.success('Course annulée');
      return true;

    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error('Erreur lors de l\'annulation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update booking status
  const updateBookingStatus = async (status: string) => {
    if (!activeBooking) return false;

    setLoading(true);
    try {
      const updates: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };

      if (status === 'completed') {
        updates.completion_time = new Date().toISOString();
        updates.actual_price = activeBooking.estimated_price;
      }

      const { error } = await supabase
        .from('transport_bookings')
        .update(updates)
        .eq('id', activeBooking.id);

      if (error) throw error;

      setActiveBooking(prev => prev ? { ...prev, status } : null);

      if (status === 'completed') {
        setActiveBooking(null);
        stopTracking();
        toast.success('Course terminée avec succès');
      } else {
        toast.success('Statut mis à jour');
      }

      return true;

    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update current location
  const updateCurrentLocation = (location: { lat: number; lng: number }) => {
    // Location updates are handled automatically by useRealtimeTracking
    console.log('Location updated:', location);
  };

  useEffect(() => {
    if (user) {
      loadPendingRequests();
    }
  }, [user]);

  return {
    loading,
    activeBooking,
    pendingRequests,
    currentLocation,
    acceptBooking,
    cancelDriverBooking,
    updateBookingStatus,
    updateCurrentLocation,
    loadPendingRequests
  };
};
