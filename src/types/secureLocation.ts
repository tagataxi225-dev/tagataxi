/**
 * Types sécurisés pour la géolocalisation des chauffeurs
 * 
 * IMPORTANT: Ces types n'exposent JAMAIS les coordonnées exactes
 * aux clients non autorisés pour protéger la vie privée des chauffeurs
 */

export interface SecureDriverResult {
  /** ID du chauffeur (UUID) */
  driver_id: string;
  /** Distance en kilomètres (arrondie à 0.1 km près) */
  distance_km: number;
  /** Temps d'arrivée estimé en minutes */
  estimated_arrival_minutes: number;
  /** Classe de véhicule */
  vehicle_class: string;
  /** Note moyenne du chauffeur */
  rating_average: number;
  /** Statut de disponibilité */
  is_available: boolean;
}

export interface DriverAvailabilityStats {
  /** Classe de véhicule */
  vehicle_class: string;
  /** Nombre de chauffeurs disponibles */
  available_count: number;
  /** Nombre de chauffeurs en ligne */
  online_count: number;
  /** Zone générale (pas de coordonnées précises) */
  zone_generale: 'centre' | 'ouest' | 'est' | 'autre';
  /** Taux de disponibilité (0-1) */
  availability_rate: number;
}

/**
 * ADMIN ONLY: Coordonnées exactes avec audit strict
 * Cette interface est exclusivement réservée aux administrateurs
 */
export interface AdminDriverLocation {
  /** Latitude exacte - ADMIN ONLY */
  latitude: number;
  /** Longitude exacte - ADMIN ONLY */
  longitude: number;
  /** Dernière mise à jour de position */
  last_ping: string;
  /** Statut en ligne */
  is_online: boolean;
  /** Statut disponible */
  is_available: boolean;
}

export interface LocationSearchParams {
  /** Latitude de l'utilisateur */
  userLat: number;
  /** Longitude de l'utilisateur */
  userLng: number;
  /** Distance maximale en km (défaut: 5km) */
  maxDistanceKm?: number;
  /** Filtre par classe de véhicule */
  vehicleClassFilter?: string;
}

export interface LocationError {
  /** Code d'erreur */
  code: 'RATE_LIMIT' | 'ACCESS_DENIED' | 'NOT_FOUND' | 'SERVER_ERROR';
  /** Message d'erreur */
  message: string;
  /** Détails additionnels */
  details?: string;
}

/**
 * SÉCURITÉ: Log d'audit pour traçabilité
 */
export interface LocationAccessLog {
  /** ID de l'utilisateur qui fait la recherche */
  accessed_by: string;
  /** Type d'accès */
  access_type: 'proximity_search' | 'exact_coordinates_admin';
  /** Rayon de recherche */
  search_radius_km?: number;
  /** Nombre de chauffeurs trouvés */
  drivers_found: number;
  /** Horodatage */
  created_at: string;
  /** Justification (pour accès admin) */
  access_reason?: string;
}

/**
 * Paramètres de configuration de sécurité
 */
export interface SecurityConfig {
  /** Nombre max de recherches par période */
  maxSearchesPerPeriod: number;
  /** Durée de la période en minutes */
  periodMinutes: number;
  /** Distance maximale autorisée en km */
  maxSearchDistance: number;
  /** Durée de rétention des logs en jours */
  logRetentionDays: number;
}

/**
 * CONSTANTES DE SÉCURITÉ
 */
export const SECURITY_LIMITS = {
  /** Rate limiting: 10 recherches par 5 minutes */
  MAX_SEARCHES_PER_5MIN: 10,
  /** Distance maximale de recherche */
  MAX_SEARCH_DISTANCE_KM: 20,
  /** Nombre maximum de résultats retournés */
  MAX_RESULTS: 20,
  /** Timeout pour les requêtes de géolocalisation */
  GEOLOCATION_TIMEOUT_MS: 10000,
} as const;

/**
 * AVERTISSEMENT DE SÉCURITÉ:
 * 
 * Ces types sont conçus pour ne JAMAIS exposer les coordonnées exactes
 * des chauffeurs aux clients. Seules les distances et temps estimés
 * sont fournis pour protéger la vie privée.
 * 
 * L'accès aux coordonnées exactes est strictement réservé aux 
 * administrateurs avec audit complet de chaque accès.
 */