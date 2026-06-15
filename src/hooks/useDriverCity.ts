/**
 * 🌍 Hook détection et gestion de la ville du chauffeur
 * - Détection automatique via GPS ou DB
 * - Changement de ville
 * - Filtrage des zones par ville
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type City = 'Kinshasa' | 'Lubumbashi' | 'Kolwezi' | 'Abidjan';

// Coordonnées approximatives des villes pour détection GPS (RDC + Côte d'Ivoire)
const CITY_COORDINATES: Record<City, { lat: number; lng: number; radius: number }> = {
  'Kinshasa': { lat: -4.3276, lng: 15.3136, radius: 50 },
  'Lubumbashi': { lat: -11.6609, lng: 27.4748, radius: 30 },
  'Kolwezi': { lat: -10.7159, lng: 25.4748, radius: 20 },
  'Abidjan': { lat: 5.3600, lng: -4.0083, radius: 40 }
};

export const useDriverCity = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [detectingCity, setDetectingCity] = useState(false);

  // Charger la ville du chauffeur depuis la DB
  const { data: driverCity, isLoading } = useQuery({
    queryKey: ['driver-city', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('chauffeurs')
        .select('city')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching driver city:', error);
        return 'Kinshasa' as City; // Fallback
      }

      // @ts-ignore - city column exists after migration
      return (data?.city || 'Kinshasa') as City;
    },
    enabled: !!user
  });

  // Détecter la ville depuis la position GPS
  const detectCityFromLocation = async (lat: number, lng: number): Promise<City | null> => {
    // Calculer la distance entre le point et chaque ville
    const distances = Object.entries(CITY_COORDINATES).map(([city, coords]) => {
      const distance = Math.sqrt(
        Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2)
      ) * 111; // Conversion approximative en km

      return { city: city as City, distance };
    });

    // Trouver la ville la plus proche
    distances.sort((a, b) => a.distance - b.distance);
    const nearest = distances[0];

    // Vérifier si dans le rayon de la ville
    const cityRadius = CITY_COORDINATES[nearest.city].radius;
    if (nearest.distance <= cityRadius) {
      return nearest.city;
    }

    return null; // Position trop éloignée de toute ville
  };

  // Auto-détecter la ville via GPS natif Capacitor
  const autoDetectCity = async (): Promise<City | null> => {
    setDetectingCity(true);
    
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });

      const detectedCity = await detectCityFromLocation(position.lat, position.lng);
      console.log(`📍 Ville détectée (${position.source}):`, detectedCity);

      return detectedCity;
    } catch (error) {
      console.error('Error detecting city from GPS:', error);
      return null;
    } finally {
      setDetectingCity(false);
    }
  };

  // Mettre à jour la ville du chauffeur
  const updateCity = useMutation({
    mutationFn: async (newCity: City) => {
      if (!user) throw new Error('Non authentifié');

      // @ts-ignore - city column exists after migration
      const { error } = await supabase
        .from('chauffeurs')
        .update({ city: newCity } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      return newCity;
    },
    onSuccess: (newCity) => {
      queryClient.invalidateQueries({ queryKey: ['driver-city'] });
      queryClient.invalidateQueries({ queryKey: ['service-zones'] });
      queryClient.invalidateQueries({ queryKey: ['driver-service-zones'] });
      toast.success(`Ville changée vers ${newCity}`);
    },
    onError: (error) => {
      console.error('Error updating city:', error);
      toast.error('Erreur lors du changement de ville');
    }
  });

  // Détecter et confirmer la ville au premier démarrage
  const detectAndConfirmCity = async () => {
    if (!user || driverCity) return; // Déjà configuré

    const detected = await autoDetectCity();
    
    if (detected) {
      // Proposer la ville détectée
      return detected;
    }

    return null;
  };

  return {
    city: driverCity || 'Kinshasa',
    loading: isLoading,
    detectingCity,
    updateCity,
    autoDetectCity,
    detectCityFromLocation,
    detectAndConfirmCity,
    availableCities: (() => {
      const isInAbidjan = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Abidjan';
      const all: City[] = ['Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'];
      return isInAbidjan ? all : all.filter(c => c !== 'Abidjan');
    })()
  };
};
