import { Car, CarFront, Bike, Crown, Zap } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

const motoIcon = '/vehicle-icons/moto.svg';
const carEcoIcon = '/vehicle-icons/car.svg';
const carConfortIcon = '/vehicle-icons/car-confort.svg';
const carPremiumIcon = '/vehicle-icons/car-premium.svg';
const deliveryMotoIcon = '/vehicle-icons/d-moto.svg';

export interface YangoVehicleTheme {
  gradient: string;
  solidColor: string;
  bgColor: string;
  icon: LucideIcon;
  svgIcon: string;
  labelColor: string;
  glowColor: string;
}

export const YANGO_VEHICLE_THEMES: Record<string, YangoVehicleTheme> = {
  'taxi_moto': {
    gradient: 'linear-gradient(135deg, #FFA726 0%, #FFB74D 50%, #FF9800 100%)',
    solidColor: '#FF9800',
    bgColor: 'bg-gradient-to-br from-orange-400 to-orange-500',
    icon: Bike,
    svgIcon: motoIcon,
    labelColor: 'text-orange-600',
    glowColor: 'rgba(255, 152, 0, 0.25)'
  },
  'taxi_eco': {
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #059669 100%)',
    solidColor: '#10B981',
    bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    icon: Car,
    svgIcon: carEcoIcon,
    labelColor: 'text-emerald-600',
    glowColor: 'rgba(16, 185, 129, 0.25)'
  },
  'taxi_confort': {
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #2563EB 100%)',
    solidColor: '#3B82F6',
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
    icon: CarFront,
    svgIcon: carConfortIcon,
    labelColor: 'text-blue-600',
    glowColor: 'rgba(59, 130, 246, 0.25)'
  },
  'taxi_premium': {
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #7C3AED 100%)',
    solidColor: '#8B5CF6',
    bgColor: 'bg-gradient-to-br from-violet-500 to-violet-600',
    icon: Crown,
    svgIcon: carPremiumIcon,
    labelColor: 'text-violet-600',
    glowColor: 'rgba(139, 92, 246, 0.3)'
  },
  'taxi_flash': {
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #FB7185 50%, #E11D48 100%)',
    solidColor: '#F43F5E',
    bgColor: 'bg-gradient-to-br from-rose-500 to-rose-600',
    icon: Zap,
    svgIcon: deliveryMotoIcon,
    labelColor: 'text-rose-600',
    glowColor: 'rgba(244, 63, 94, 0.25)'
  }
};

export const getYangoTheme = (vehicleType: string): YangoVehicleTheme => {
  return YANGO_VEHICLE_THEMES[vehicleType] || YANGO_VEHICLE_THEMES['taxi_eco'];
};
