export interface VehicleType {
  id: string;
  name: string;
  description: string;
  icon: 'Car' | 'Bike' | 'Bus' | 'Truck';
  gradient: string;
  basePrice: number;
  pricePerKm: number;
  calculatedPrice: number;
  eta: number;
  driverEta: number;
  tripDuration?: number;
  features: string[];
  capacity: number;
  available: boolean;
  isPopular?: boolean;
}

export interface VehicleConfig {
  displayName: string;
  icon: 'Car' | 'Bike' | 'Bus' | 'Truck';
  gradient: string;
  description: string;
  color: string;
  // Nouvelles propriétés pour le design soft moderne
  bgSoft: string;
  bgSelected: string;
  textColor: string;
  iconBg: string;
  iconBgSelected: string;
  borderSelected: string;
}
