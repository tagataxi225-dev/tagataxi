import { Bike, Car, CarFront, Crown, Zap, Truck, Package, type LucideIcon } from 'lucide-react';

export interface VehicleLucideIcon {
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  bgSelectedClass: string;
  gradientFrom: string;
  gradientTo: string;
}

const VEHICLE_LUCIDE_MAP: Record<string, VehicleLucideIcon> = {
  // Taxi types
  taxi_moto: { icon: Bike, colorClass: 'text-orange-50', bgClass: 'bg-gradient-to-br from-orange-400 to-amber-500', bgSelectedClass: 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30 shadow-md', gradientFrom: 'from-orange-400', gradientTo: 'to-amber-500' },
  taxi_eco: { icon: Car, colorClass: 'text-emerald-50', bgClass: 'bg-gradient-to-br from-emerald-400 to-teal-500', bgSelectedClass: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30 shadow-md', gradientFrom: 'from-emerald-400', gradientTo: 'to-teal-500' },
  taxi_confort: { icon: CarFront, colorClass: 'text-blue-50', bgClass: 'bg-gradient-to-br from-blue-400 to-indigo-500', bgSelectedClass: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30 shadow-md', gradientFrom: 'from-blue-400', gradientTo: 'to-indigo-500' },
  taxi_comfort: { icon: CarFront, colorClass: 'text-blue-50', bgClass: 'bg-gradient-to-br from-blue-400 to-indigo-500', bgSelectedClass: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30 shadow-md', gradientFrom: 'from-blue-400', gradientTo: 'to-indigo-500' },
  taxi_premium: { icon: Crown, colorClass: 'text-violet-50', bgClass: 'bg-gradient-to-br from-violet-400 to-purple-600', bgSelectedClass: 'bg-gradient-to-br from-violet-500 to-purple-700 shadow-violet-500/30 shadow-md', gradientFrom: 'from-violet-400', gradientTo: 'to-purple-600' },
  taxi_flash: { icon: Zap, colorClass: 'text-yellow-50', bgClass: 'bg-gradient-to-br from-yellow-400 to-orange-500', bgSelectedClass: 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-yellow-500/30 shadow-md', gradientFrom: 'from-yellow-400', gradientTo: 'to-orange-500' },

  // Delivery types
  flash: { icon: Zap, colorClass: 'text-yellow-50', bgClass: 'bg-gradient-to-br from-yellow-400 to-orange-500', bgSelectedClass: 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-yellow-500/30 shadow-md', gradientFrom: 'from-yellow-400', gradientTo: 'to-orange-500' },
  flex: { icon: Package, colorClass: 'text-sky-50', bgClass: 'bg-gradient-to-br from-sky-400 to-cyan-500', bgSelectedClass: 'bg-gradient-to-br from-sky-500 to-cyan-600 shadow-sky-500/30 shadow-md', gradientFrom: 'from-sky-400', gradientTo: 'to-cyan-500' },
  maxicharge: { icon: Truck, colorClass: 'text-red-50', bgClass: 'bg-gradient-to-br from-red-400 to-rose-500', bgSelectedClass: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30 shadow-md', gradientFrom: 'from-red-400', gradientTo: 'to-rose-500' },
  cargo: { icon: Truck, colorClass: 'text-red-50', bgClass: 'bg-gradient-to-br from-red-400 to-rose-500', bgSelectedClass: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30 shadow-md', gradientFrom: 'from-red-400', gradientTo: 'to-rose-500' },

  // Short aliases
  moto: { icon: Bike, colorClass: 'text-orange-50', bgClass: 'bg-gradient-to-br from-orange-400 to-amber-500', bgSelectedClass: 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30 shadow-md', gradientFrom: 'from-orange-400', gradientTo: 'to-amber-500' },
  eco: { icon: Car, colorClass: 'text-emerald-50', bgClass: 'bg-gradient-to-br from-emerald-400 to-teal-500', bgSelectedClass: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30 shadow-md', gradientFrom: 'from-emerald-400', gradientTo: 'to-teal-500' },
  confort: { icon: CarFront, colorClass: 'text-blue-50', bgClass: 'bg-gradient-to-br from-blue-400 to-indigo-500', bgSelectedClass: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30 shadow-md', gradientFrom: 'from-blue-400', gradientTo: 'to-indigo-500' },
  comfort: { icon: CarFront, colorClass: 'text-blue-50', bgClass: 'bg-gradient-to-br from-blue-400 to-indigo-500', bgSelectedClass: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30 shadow-md', gradientFrom: 'from-blue-400', gradientTo: 'to-indigo-500' },
  premium: { icon: Crown, colorClass: 'text-violet-50', bgClass: 'bg-gradient-to-br from-violet-400 to-purple-600', bgSelectedClass: 'bg-gradient-to-br from-violet-500 to-purple-700 shadow-violet-500/30 shadow-md', gradientFrom: 'from-violet-400', gradientTo: 'to-purple-600' },
};

const DEFAULT_ICON: VehicleLucideIcon = { icon: Car, colorClass: 'text-emerald-50', bgClass: 'bg-gradient-to-br from-emerald-400 to-teal-500', bgSelectedClass: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30 shadow-md', gradientFrom: 'from-emerald-400', gradientTo: 'to-teal-500' };

export function getVehicleLucideIcon(vehicleId: string): VehicleLucideIcon {
  return VEHICLE_LUCIDE_MAP[vehicleId] || DEFAULT_ICON;
}
