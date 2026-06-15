export const VEHICLE_3D_ICONS: Record<string, string> = {
  // Taxi types
  'taxi_moto': '/vehicle-icons/moto.svg',
  'taxi_eco': '/vehicle-icons/car.svg',
  'taxi_confort': '/vehicle-icons/car-confort.svg',
  'taxi_comfort': '/vehicle-icons/car-confort.svg',
  'taxi_premium': '/vehicle-icons/car-premium.svg',

  // Delivery types
  'flash': '/vehicle-icons/d-moto.svg',
  'delivery_flash': '/vehicle-icons/d-moto.svg',
  'flex': '/vehicle-icons/d-flex.svg',
  'delivery_flex': '/vehicle-icons/d-flex.svg',
  'maxicharge': '/vehicle-icons/d-maxi.svg',
  'delivery_maxi': '/vehicle-icons/d-maxi.svg',
  'cargo': '/vehicle-icons/d-maxi.svg',

  // Alternative IDs
  'moto': '/vehicle-icons/moto.svg',
  'eco': '/vehicle-icons/car.svg',
  'confort': '/vehicle-icons/car-confort.svg',
  'comfort': '/vehicle-icons/car-confort.svg',
  'standard': '/vehicle-icons/car-confort.svg',
  'premium': '/vehicle-icons/car-premium.svg',
};

export const getVehicle3dIcon = (vehicleId: string): string =>
  VEHICLE_3D_ICONS[vehicleId] || '/vehicle-icons/car.svg';
