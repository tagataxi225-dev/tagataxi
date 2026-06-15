export interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  coordinates: [number, number][];
  maneuver?: string;
  streetName?: string;
}

export interface TripLocation {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

export interface NavigationRoute {
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
  geometry: [number, number][];
  steps: NavigationStep[];
  trafficAware: boolean;
  provider: 'google' | 'fallback';
}

export interface TripData {
  id: string;
  type: 'transport' | 'delivery' | 'marketplace';
  status: 'pending' | 'accepted' | 'in_progress' | 'pickup' | 'delivering' | 'completed' | 'cancelled';
  pickup: TripLocation;
  destination: TripLocation;
  intermediateStops?: TripLocation[];
  clientInfo?: {
    name: string;
    phone: string;
    instructions?: string;
  };
  packageInfo?: {
    type: string;
    description?: string;
    value?: number;
    weight?: number;
  };
  estimatedPrice?: number;
  actualPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceSettings {
  enabled: boolean;
  volume: number;
  language: 'fr' | 'en';
  voice: string;
  autoPlay: boolean;
}

export interface NavigationState {
  isActive: boolean;
  currentStep: number;
  remainingDistance: number;
  remainingDuration: number;
  nextInstruction?: string;
  currentLocation?: { lat: number; lng: number };
  offRoute: boolean;
  recalculating: boolean;
}