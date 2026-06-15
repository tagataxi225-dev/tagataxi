import { VehicleConfig } from '@/types/vehicle';

export const VEHICLE_TYPE_MAPPING: Record<string, VehicleConfig> = {
  // Mapping exact avec service_configurations.service_type
  'taxi_moto': {
    displayName: 'Moto-taxi',
    icon: 'Bike',
    gradient: 'from-amber-500 via-yellow-500 to-amber-600',
    description: 'Transport rapide et économique par moto',
    color: '#F59E0B',
    // Design soft moderne
    bgSoft: 'bg-rose-50/80 dark:bg-rose-950/30',
    bgSelected: 'bg-rose-100 dark:bg-rose-900/40',
    textColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
    iconBgSelected: 'bg-rose-200 dark:bg-rose-800/60',
    borderSelected: 'border-rose-300 dark:border-rose-700'
  },
  'taxi_eco': {
    displayName: 'Éco',
    icon: 'Car',
    gradient: 'from-green-500 via-emerald-500 to-green-600',
    description: 'Option économique pour vos déplacements',
    color: '#10B981',
    // Design soft moderne
    bgSoft: 'bg-amber-50/80 dark:bg-amber-950/30',
    bgSelected: 'bg-amber-100 dark:bg-amber-900/40',
    textColor: 'text-amber-700 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconBgSelected: 'bg-amber-200 dark:bg-amber-800/60',
    borderSelected: 'border-amber-300 dark:border-amber-700'
  },
  'taxi_confort': {
    displayName: 'Confort',
    icon: 'Car',
    gradient: 'from-blue-500 via-sky-500 to-blue-600',
    description: 'Confort et qualité pour vos trajets',
    color: '#3B82F6',
    // Design soft moderne
    bgSoft: 'bg-sky-50/80 dark:bg-sky-950/30',
    bgSelected: 'bg-sky-100 dark:bg-sky-900/40',
    textColor: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-100 dark:bg-sky-900/50',
    iconBgSelected: 'bg-sky-200 dark:bg-sky-800/60',
    borderSelected: 'border-sky-300 dark:border-sky-700'
  },
  'taxi_premium': {
    displayName: 'Premium',
    icon: 'Car',
    gradient: 'from-purple-500 via-violet-500 to-purple-600',
    description: 'Luxe et prestige pour une expérience unique',
    color: '#8B5CF6',
    // Design soft moderne
    bgSoft: 'bg-violet-50/80 dark:bg-violet-950/30',
    bgSelected: 'bg-violet-100 dark:bg-violet-900/40',
    textColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
    iconBgSelected: 'bg-violet-200 dark:bg-violet-800/60',
    borderSelected: 'border-violet-300 dark:border-violet-700'
  }
};

export const getVehicleConfig = (vehicleType: string): VehicleConfig => {
  return VEHICLE_TYPE_MAPPING[vehicleType] || {
    displayName: vehicleType,
    icon: 'Car',
    gradient: 'from-gray-400 to-gray-500',
    description: 'Véhicule standard',
    color: '#9CA3AF',
    bgSoft: 'bg-muted/50',
    bgSelected: 'bg-muted',
    textColor: 'text-foreground',
    iconBg: 'bg-muted',
    iconBgSelected: 'bg-muted/80',
    borderSelected: 'border-border'
  };
};
