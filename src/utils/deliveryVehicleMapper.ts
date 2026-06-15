/**
 * Mapping des types de livraison vers les classes de véhicules
 * - Flash = Moto (petit colis, max 5kg)
 * - Flex = Camionnette / Van (colis moyen volume)
 * - MaxiCharge = Camion (gros volume)
 */

export type DeliveryType = 'flash' | 'flex' | 'maxicharge';
export type VehicleClass = 'moto' | 'van' | 'truck';

export const DELIVERY_TO_VEHICLE_MAPPING: Record<DeliveryType, VehicleClass> = {
  'flash': 'moto',        // Livraison express → Moto
  'flex': 'van',           // Livraison camionnette → Van
  'maxicharge': 'truck'    // Gros colis → Camion
};

/**
 * Convertit un type de livraison en classe de véhicule requise
 */
export const getVehicleClassForDelivery = (deliveryType: string): VehicleClass | null => {
  const normalizedType = deliveryType.toLowerCase() as DeliveryType;
  return DELIVERY_TO_VEHICLE_MAPPING[normalizedType] || null;
};

/**
 * Vérifie si un véhicule peut gérer un type de livraison
 */
export const canVehicleHandleDelivery = (
  vehicleClass: string, 
  deliveryType: string
): boolean => {
  const normalizedVehicle = vehicleClass.toLowerCase();
  const normalizedDelivery = deliveryType.toLowerCase();

  // Moto : peut faire flash et flex (petit colis uniquement)
  if (normalizedVehicle === 'moto') {
    return normalizedDelivery === 'flash' || normalizedDelivery === 'flex';
  }
  
  // Van / Camionnette : peut faire flex et maxicharge (dépannage)
  if (normalizedVehicle === 'van' || normalizedVehicle === 'camionnette') {
    return normalizedDelivery === 'flex' || normalizedDelivery === 'maxicharge';
  }
  
  // Truck / Camion : peut faire flex et maxicharge
  if (normalizedVehicle === 'truck' || normalizedVehicle === 'camion') {
    return normalizedDelivery === 'flex' || normalizedDelivery === 'maxicharge';
  }
  
  return false;
};

/**
 * Labels français pour les classes de véhicules
 */
export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  'moto': 'Moto',
  'van': 'Camionnette',
  'truck': 'Camion'
};
