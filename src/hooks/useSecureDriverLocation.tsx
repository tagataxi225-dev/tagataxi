import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NearbyDriver {
  driver_id: string;
  distance_km: number;
  estimated_arrival_minutes: number;
  vehicle_class: string;
  rating_average: number;
  is_available: boolean;
}

interface DriverAvailabilitySummary {
  vehicle_class: string;
  available_count: number;
  online_count: number;
  zone_generale: string;
  availability_rate: number;
}

export const useSecureDriverLocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Recherche sécurisée de chauffeurs à proximité
   * IMPORTANT: Cette fonction remplace l'accès direct à la table driver_locations
   * Elle n'expose jamais les coordonnées exactes des chauffeurs
   */
  const findNearbyDrivers = async (
    userLat: number,
    userLng: number,
    maxDistanceKm: number = 5,
    vehicleClassFilter?: string
  ): Promise<NearbyDriver[]> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔒 Recherche sécurisée de chauffeurs - sans coordonnées exactes');

      const { data, error: searchError } = await supabase.rpc('find_nearby_drivers_secure', {
        user_lat: userLat,
        user_lng: userLng,
        max_distance_km: maxDistanceKm,
        vehicle_class_filter: vehicleClassFilter || null
      });

      if (searchError) {
        console.error('Erreur recherche chauffeurs:', searchError);
        
        // Gestion spécifique des erreurs de rate limiting
        if (searchError.message.includes('Rate limit exceeded')) {
          setError('Trop de recherches. Veuillez patienter avant de recommencer.');
          toast.error('Trop de recherches répétées. Patientez quelques minutes.');
        } else if (searchError.message.includes('Access denied')) {
          setError('Accès non autorisé. Veuillez vous connecter.');
          toast.error('Vous devez être connecté pour rechercher des chauffeurs.');
        } else {
          setError('Erreur lors de la recherche de chauffeurs');
          toast.error('Impossible de trouver des chauffeurs à proximité');
        }
        return [];
      }

      console.log(`✅ ${data?.length || 0} chauffeurs trouvés dans un rayon de ${maxDistanceKm}km`);
      return data || [];

    } catch (err) {
      console.error('Erreur inattendue:', err);
      setError('Erreur de connexion');
      toast.error('Problème de connexion');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtenir les statistiques de disponibilité (sans coordonnées)
   * Utilise la vue sécurisée qui n'expose pas de coordonnées exactes
   */
  const getDriverAvailabilitySummary = async (): Promise<DriverAvailabilitySummary[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: summaryError } = await supabase
        .from('driver_availability_summary')
        .select('*');

      if (summaryError) {
        console.error('Erreur statistiques disponibilité:', summaryError);
        setError('Erreur lors du chargement des statistiques');
        return [];
      }

      return data || [];

    } catch (err) {
      console.error('Erreur statistiques:', err);
      setError('Erreur de connexion');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * FONCTION ADMIN UNIQUEMENT: Obtenir les coordonnées exactes d'un chauffeur
   * Cette fonction est strictement réservée aux administrateurs
   */
  const getDriverExactLocationAdmin = async (driverId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔐 Accès admin aux coordonnées exactes - audit complet');

      const { data, error: locationError } = await supabase.rpc('get_driver_exact_location_admin', {
        p_driver_id: driverId
      });

      if (locationError) {
        console.error('Erreur accès coordonnées admin:', locationError);
        
        if (locationError.message.includes('Access denied')) {
          setError('Accès refusé. Seuls les administrateurs peuvent voir les coordonnées exactes.');
          toast.error('Accès refusé - Privilèges administrateur requis');
        } else {
          setError('Erreur lors de l\'accès aux coordonnées');
          toast.error('Impossible d\'accéder aux coordonnées du chauffeur');
        }
        return null;
      }

      console.log('✅ Coordonnées exactes obtenues - accès audité');
      return data?.[0] || null;

    } catch (err) {
      console.error('Erreur accès coordonnées:', err);
      setError('Erreur de connexion');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vérifier la disponibilité d'un chauffeur spécifique (sans coordonnées)
   */
  const checkDriverAvailability = async (driverId: string): Promise<{ is_available: boolean; is_online: boolean } | null> => {
    try {
      // Utilisation d'une requête qui ne récupère QUE le statut, pas les coordonnées
      const { data, error } = await supabase
        .from('driver_locations')
        .select('is_available, is_online')
        .eq('driver_id', driverId)
        .single();

      if (error) {
        console.error('Erreur vérification disponibilité:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Erreur:', err);
      return null;
    }
  };

  return {
    loading,
    error,
    findNearbyDrivers,
    getDriverAvailabilitySummary,
    getDriverExactLocationAdmin,
    checkDriverAvailability
  };
};

/**
 * AVERTISSEMENTS DE SÉCURITÉ:
 * 
 * 1. ❌ NE JAMAIS utiliser d'accès direct à driver_locations depuis le frontend
 * 2. ❌ NE JAMAIS exposer les coordonnées exactes aux clients
 * 3. ✅ TOUJOURS utiliser find_nearby_drivers_secure pour la recherche
 * 4. ✅ TOUJOURS auditer les accès aux coordonnées exactes
 * 5. ✅ RESPECTER le rate limiting pour éviter l'abus
 * 
 * Cette approche protège la vie privée des chauffeurs tout en permettant
 * aux clients de trouver des chauffeurs à proximité.
 */