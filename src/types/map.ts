/**
 * Types et interfaces pour le système de cartographie Tembea
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CoordinatesWithHeading extends Coordinates {
  heading?: number | null;
  speed?: number | null;
}

export interface MarkerConfig {
  position: Coordinates;
  map: google.maps.Map;
  title?: string;
  draggable?: boolean;
  onClick?: () => void;
}

export interface AnimatedMarkerConfig extends MarkerConfig {
  animation?: 'bounce' | 'drop' | 'pulse' | 'none';
  animationDuration?: number;
}

export interface DriverMarkerConfig extends MarkerConfig {
  heading: number;
  speed?: number;
  driverName?: string;
  driverPhoto?: string;
  vehicleModel?: string;
  smoothTransition?: boolean;
}

export interface MapCameraOptions {
  center: Coordinates;
  zoom?: number;
  tilt?: number;
  heading?: number;
}

export interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver?: string;
}

export interface NavigationRoute {
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
  steps: NavigationStep[];
  polyline: string;
  bounds?: google.maps.LatLngBounds;
}

export interface DriverLocationUpdate {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: string;
  is_online: boolean;
  is_available: boolean;
}

export interface RealtimeTrackingData {
  driverLocation: DriverLocationUpdate | null;
  eta: number | null; // en minutes
  distance: number | null; // en km
  isMoving: boolean;
  lastUpdate: Date | null;
}

export type MarkerType = 'pickup' | 'destination' | 'driver' | 'waypoint' | 'user';

export interface MapStyleConfig {
  theme: 'light' | 'dark';
  customStyles?: google.maps.MapTypeStyle[];
}
