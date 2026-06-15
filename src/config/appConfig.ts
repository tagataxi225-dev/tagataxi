/**
 * 📱 KWENDA SUPER APP CONFIGURATION
 *
 * Configuration unique pour l'application multi-rôles.
 * L'utilisateur bascule entre les espaces (Client/Chauffeur/Partenaire) depuis l'app.
 *
 * ⚠️  NE PAS MODIFIER via Lovable UI — ce fichier est la source de vérité centrale.
 *     Les composants lisent leurs constantes d'ici ; modifier directement dans les
 *     composants crée des divergences silencieuses au prochain push Lovable.
 */

export type UserRole = 'client' | 'driver' | 'partner' | 'admin' | 'restaurant';

export const APP_CONFIG = {
  // ─── Identité app ───────────────────────────────────────────────────────────
  name: 'Tembea',
  appId: 'cd.kwenda.app',
  primaryColor: '#DC2626',
  defaultRoute: '/app',
  authRoute: '/auth',
  version: '1.24.0',

  // ─── Google Maps ────────────────────────────────────────────────────────────
  // Clé restreinte par HTTP Referrer dans Google Cloud Console — safe côté client.
  // Ordre de résolution : sessionStorage → edge function → VITE_GOOGLE_MAPS_API_KEY → ici.
  GOOGLE_MAPS_API_KEY: 'AIzaSyAOlkwFPy5ivwyW_FV6BusyUkz0zEp4Gkc',

  // ─── Villes couvertes ───────────────────────────────────────────────────────
  COVERED_CITIES: ['Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'] as string[],
  DEFAULT_CITY: 'Kinshasa',
  DEFAULT_CURRENCY: 'CDF',

  // ─── Timeouts (ms) ──────────────────────────────────────────────────────────
  MAPS_LOAD_TIMEOUT_MS: 15_000,
  UI_READY_DELAY_MS: 400,
  GEOCODE_THROTTLE_MS: 30_000,

  // ─── Circuit breakers ───────────────────────────────────────────────────────
  MAX_DRIVER_ERRORS: 3,   // useLiveDrivers : stop polling après N erreurs consécutives
  MAX_MAPS_FAILURES: 3,   // googleMapsLoader : stop retry après N échecs de chargement
} as const;

// Couleurs par rôle pour le thème dynamique
export const ROLE_COLORS: Record<UserRole, string> = {
  client: '#DC2626',    // Rouge
  driver: '#F59E0B',    // Orange
  partner: '#10B981',   // Vert
  admin: '#6366F1',     // Indigo
  restaurant: '#EC4899', // Rose
};

// Routes par défaut selon le rôle
export const ROLE_ROUTES: Record<UserRole, string> = {
  client: '/client',
  driver: '/chauffeur',
  partner: '/partenaire',
  admin: '/operatorx/admin',
  restaurant: '/restaurant',
};

// Helper pour obtenir la couleur d'un rôle
export const getRoleColor = (role: UserRole): string => ROLE_COLORS[role] || APP_CONFIG.primaryColor;

// Helper pour obtenir la route d'un rôle
export const getRoleRoute = (role: UserRole): string => ROLE_ROUTES[role] || '/client';
