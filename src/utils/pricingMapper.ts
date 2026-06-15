/**
 * Mapping entre service_type (service_configurations) et vehicle_class (pricing_rules)
 * Ce fichier centralise la correspondance pour unifier le système de tarification
 * 
 * 📚 DOCUMENTATION:
 * - service_configurations.service_type: 'flash', 'flex', 'maxicharge', 'taxi_eco', etc. (simple)
 * - pricing_rules: service_type='delivery'|'transport' + vehicle_class='flash'|'eco'|etc.
 */

export const SERVICE_TYPE_TO_VEHICLE_CLASS: Record<string, string> = {
  // Transport VTC
  'taxi_eco': 'eco',
  'taxi_confort': 'standard',
  'taxi_premium': 'premium',
  'taxi_moto': 'moto',
  // Delivery
  'delivery_flash': 'flash',
  'delivery_flex': 'flex',
  'delivery_maxicharge': 'maxicharge'
};

/**
 * Mapping spécifique pour les services de livraison
 * Retourne les clés nécessaires pour requêter pricing_rules
 */
export const DELIVERY_SERVICE_MAPPING = {
  'flash': { service_type: 'delivery', vehicle_class: 'flash' },
  'flex': { service_type: 'delivery', vehicle_class: 'flex' },
  'maxicharge': { service_type: 'delivery', vehicle_class: 'maxicharge' }
} as const;

export const VEHICLE_CLASS_TO_SERVICE_TYPE: Record<string, string> = {
  // Transport VTC
  'eco': 'taxi_eco',
  'standard': 'taxi_confort',
  'premium': 'taxi_premium',
  'moto': 'taxi_moto',
  // Delivery
  'flash': 'delivery_flash',
  'flex': 'delivery_flex',
  'maxicharge': 'delivery_maxicharge'
};

/**
 * Convertit un service_type en vehicle_class
 * @param serviceType - Type de service (ex: 'taxi_eco')
 * @returns vehicle_class correspondant (ex: 'eco')
 */
export const getVehicleClass = (serviceType: string): string => {
  return SERVICE_TYPE_TO_VEHICLE_CLASS[serviceType] || 'standard';
};

/**
 * Convertit un vehicle_class en service_type
 * @param vehicleClass - Classe de véhicule (ex: 'eco')
 * @returns service_type correspondant (ex: 'taxi_confort')
 */
export const getServiceType = (vehicleClass: string): string => {
  return VEHICLE_CLASS_TO_SERVICE_TYPE[vehicleClass] || 'taxi_confort';
};

/**
 * Récupère les clés de tarification pour un service de livraison
 * @param serviceType - Type de service de livraison ('flash' | 'flex' | 'maxicharge')
 * @returns Objet avec service_type et vehicle_class pour requêter pricing_rules
 */
export const getDeliveryPricingKey = (
  serviceType: 'flash' | 'flex' | 'maxicharge'
): { service_type: string; vehicle_class: string } => {
  return DELIVERY_SERVICE_MAPPING[serviceType];
};
