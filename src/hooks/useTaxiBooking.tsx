import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TaxiBookingData {
  pickup_location: string;
  destination: string;
  pickup_coordinates: { lat: number; lng: number };
  destination_coordinates: { lat: number; lng: number };
  vehicle_class: string;
  estimated_price: number;
}

interface Booking {
  id: string;
  pickup_location: string;
  destination: string;
  estimated_price: number;
  status: string;
  created_at: string;
  driver_id?: string;
}

// Supported cities with their bounds for validation
const SUPPORTED_CITIES = {
  kinshasa: {
    name: 'Kinshasa',
    bounds: { north: -4.2, south: -4.5, east: 15.5, west: 15.1 },
    currency: 'XOF'
  },
  lubumbashi: {
    name: 'Lubumbashi',
    bounds: { north: -11.5, south: -11.8, east: 27.6, west: 27.3 },
    currency: 'XOF'
  },
  kolwezi: {
    name: 'Kolwezi',
    bounds: { north: -10.6, south: -10.9, east: 25.6, west: 25.3 },
    currency: 'XOF'
  },
};

// Detect city from coordinates
const detectCityFromCoordinates = (lat: number, lng: number): string => {
  for (const [key, city] of Object.entries(SUPPORTED_CITIES)) {
    const { bounds } = city;
    if (lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west) {
      return city.name;
    }
  }
  return 'Kinshasa'; // Default fallback
};

export const useTaxiBooking = () => {
  const [loading, setLoading] = useState(false);

  const createBooking = async (booking: TaxiBookingData): Promise<string | null> => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté pour réserver');
        return null;
      }

      // Detect city from pickup coordinates
      const city = detectCityFromCoordinates(
        booking.pickup_coordinates.lat,
        booking.pickup_coordinates.lng
      );

      const { data, error } = await supabase
        .from('transport_bookings')
        .insert({
          user_id: user.id,
          pickup_location: booking.pickup_location,
          destination: booking.destination,
          pickup_coordinates: booking.pickup_coordinates,
          destination_coordinates: booking.destination_coordinates,
          vehicle_type: booking.vehicle_class,
          estimated_price: booking.estimated_price,
          city: city,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        activity_type: 'taxi_booking_created',
        description: 'Nouvelle réservation taxi créée',
        metadata: { booking_id: data.id, user_id: user.id }
      });

      return data.id;
    } catch (error: any) {
      console.error('Erreur création réservation:', error);
      const errorMessage = error.message?.includes('location')
        ? 'Adresse invalide ou hors zone de service. Vérifiez votre localisation.'
        : error.message?.includes('wallet')
        ? 'Solde insuffisant. Rechargez votre portefeuille TembeaPay.'
        : error.message?.includes('no drivers')
        ? 'Aucun chauffeur disponible dans votre zone. Réessayez dans quelques minutes.'
        : 'Impossible de créer la réservation. Vérifiez votre connexion.';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedPrice = async (
    pickup: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    vehicleClass: string
  ): Promise<number> => {
    // Haversine distance calculation
    const R = 6371;
    const dLat = ((destination.lat - pickup.lat) * Math.PI) / 180;
    const dLng = ((destination.lng - pickup.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickup.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Default pricing
    const basePrice = vehicleClass === 'vip' ? 5000 : vehicleClass === 'premium' ? 3000 : 2000;
    const pricePerKm = vehicleClass === 'vip' ? 800 : vehicleClass === 'premium' ? 500 : 300;
    
    return Math.round(basePrice + distance * pricePerKm);
  };

  const getUserBookings = async (): Promise<Booking[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération réservations:', error);
      return [];
    }
  };

  return {
    loading,
    createBooking,
    getEstimatedPrice,
    getUserBookings,
    detectCityFromCoordinates,
    SUPPORTED_CITIES
  };
};
