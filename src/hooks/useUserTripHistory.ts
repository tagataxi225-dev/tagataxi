import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSmartGeolocation } from './useSmartGeolocation';

export interface TripDestination {
  id: string;
  destination: string;
  destination_coordinates: { lat: number; lng: number };
  frequency: number;
  last_visit: string;
}

interface TripHistory {
  destinations: TripDestination[];
  isLoading: boolean;
  error: Error | null;
}

// Validation géographique : vérifier si les coordonnées sont dans les limites de la ville
const isInCityBounds = (coords: { lat: number; lng: number }, cityName: string): boolean => {
  const cityBounds: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
    'Kinshasa': { minLat: -4.5, maxLat: -4.2, minLng: 15.2, maxLng: 15.6 },
    'Lubumbashi': { minLat: -11.8, maxLat: -11.5, minLng: 27.3, maxLng: 27.6 },
    'Kolwezi': { minLat: -10.8, maxLat: -10.6, minLng: 25.3, maxLng: 25.6 },
    'Abidjan': { minLat: 5.15, maxLat: 5.45, minLng: -4.15, maxLng: -3.85 }
  };

  const bounds = cityBounds[cityName];
  if (!bounds) {
    console.log(`⚠️ Pas de bounds définies pour ${cityName}, pas de filtrage géographique`);
    return true; // Pas de validation si ville inconnue
  }

  const isValid = coords.lat >= bounds.minLat && 
                  coords.lat <= bounds.maxLat &&
                  coords.lng >= bounds.minLng &&
                  coords.lng <= bounds.maxLng;

  return isValid;
};

export const useUserTripHistory = (): TripHistory => {
  const { user } = useAuth();
  const { currentCity } = useSmartGeolocation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-trip-history', user?.id, currentCity?.name],
    queryFn: async () => {
      if (!user?.id) return [];

      const cityFilter = currentCity?.name || 'Kinshasa';
      
      console.log('🗺️ Chargement historique pour:', {
        userId: user.id,
        ville: cityFilter
      });

      const { data, error } = await supabase
        .from('transport_bookings')
        .select('id, destination, destination_coordinates, created_at, pickup_location')
        .eq('user_id', user.id)
        .in('status', ['completed', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`📊 Bookings récupérés: ${data?.length || 0}`);

      // Grouper par destination et calculer la fréquence
      const destinationMap = new Map<string, TripDestination>();
      let filteredOut = 0;

      data?.forEach((booking) => {
        if (!booking.destination || !booking.destination_coordinates) return;

        // Type assertion pour les coordonnées
        const coords = booking.destination_coordinates as unknown as { lat: number; lng: number };
        
        // Validation géographique : filtrer les destinations hors de la ville actuelle
        if (!isInCityBounds(coords, cityFilter)) {
          filteredOut++;
          console.log(`🚫 Destination hors limites de ${cityFilter}:`, {
            destination: booking.destination,
            coords
          });
          return;
        }

        const key = `${booking.destination}-${coords.lat}-${coords.lng}`;
        
        if (destinationMap.has(key)) {
          const existing = destinationMap.get(key)!;
          destinationMap.set(key, {
            ...existing,
            frequency: existing.frequency + 1,
            last_visit: booking.created_at > existing.last_visit ? booking.created_at : existing.last_visit
          });
        } else {
          destinationMap.set(key, {
            id: booking.id,
            destination: booking.destination,
            destination_coordinates: coords,
            frequency: 1,
            last_visit: booking.created_at
          });
        }
      });

      const validDestinations = Array.from(destinationMap.values())
        .sort((a, b) => {
          if (b.frequency !== a.frequency) {
            return b.frequency - a.frequency;
          }
          return new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime();
        })
        .slice(0, 10);

      console.log('✅ Historique filtré:', {
        ville: cityFilter,
        totalBookings: data?.length,
        validDestinations: validDestinations.length,
        filteredOut,
        topDestinations: validDestinations.slice(0, 3).map(d => ({
          name: d.destination,
          frequency: d.frequency
        }))
      });

      return validDestinations;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000
  });

  return {
    destinations: data || [],
    isLoading,
    error: error as Error | null
  };
};
