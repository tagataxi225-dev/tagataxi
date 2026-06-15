/**
 * Sélecteur de spécialisation de service (Moto-taxi, Éco, Flash, Flex, etc.)
 * Compatible avec vehicle_type et service_category
 */

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Bike, Car, Package, Truck, Zap, Clock, Box } from 'lucide-react';

interface Specialization {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
  vehicleTypes: string[]; // Types de véhicules compatibles
}

interface ServiceSpecializationSelectorProps {
  serviceCategory: 'taxi' | 'delivery';
  vehicleType: string;
  selectedSpecialization: string | null;
  onSpecializationSelect: (specialization: string) => void;
}

// Définition des spécialisations
const TAXI_SPECIALIZATIONS: Specialization[] = [
  {
    value: 'taxi_moto',
    label: 'Moto-Taxi',
    icon: <Bike className="w-6 h-6" />,
    description: 'Transport rapide et économique',
    gradient: 'from-amber-500 to-yellow-600',
    vehicleTypes: ['moto']
  },
  {
    value: 'taxi_eco',
    label: 'Éco',
    icon: <Car className="w-6 h-6" />,
    description: 'Option économique standard',
    gradient: 'from-green-500 to-emerald-600',
    vehicleTypes: ['voiture']
  },
  {
    value: 'taxi_confort',
    label: 'Confort',
    icon: <Car className="w-6 h-6" />,
    description: 'Confort et qualité',
    gradient: 'from-blue-500 to-sky-600',
    vehicleTypes: ['voiture']
  },
  {
    value: 'taxi_premium',
    label: 'Premium',
    icon: <Car className="w-6 h-6" />,
    description: 'Luxe et prestige',
    gradient: 'from-purple-500 to-violet-600',
    vehicleTypes: ['voiture']
  }
];

const DELIVERY_SPECIALIZATIONS: Specialization[] = [
  {
    value: 'flash',
    label: 'Flash',
    icon: <Zap className="w-6 h-6" />,
    description: 'Livraison express (5000 CDF + 500/km)',
    gradient: 'from-orange-500 to-red-600',
    vehicleTypes: ['moto']
  },
  {
    value: 'flex',
    label: 'Flex',
    icon: <Clock className="w-6 h-6" />,
    description: 'Livraison standard (3000 CDF + 300/km)',
    gradient: 'from-blue-500 to-indigo-600',
    vehicleTypes: ['moto', 'voiture']
  },
  {
    value: 'maxicharge',
    label: 'MaxiCharge',
    icon: <Truck className="w-6 h-6" />,
    description: 'Gros colis (8000 CDF + 800/km)',
    gradient: 'from-green-500 to-teal-600',
    vehicleTypes: ['camionnette']
  }
];

export const ServiceSpecializationSelector = ({
  serviceCategory,
  vehicleType,
  selectedSpecialization,
  onSpecializationSelect
}: ServiceSpecializationSelectorProps) => {
  // Filtrer les spécialisations selon le type de service et le véhicule
  const availableSpecializations = (
    serviceCategory === 'taxi' ? TAXI_SPECIALIZATIONS : DELIVERY_SPECIALIZATIONS
  ).filter(spec => spec.vehicleTypes.includes(vehicleType));

  if (availableSpecializations.length === 0) {
    return (
      <Card className="p-6 bg-orange-500/10 border-orange-500/20">
        <p className="text-sm text-muted-foreground text-center">
          Aucune spécialisation disponible pour ce type de véhicule.
          Veuillez vérifier votre sélection.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Choisissez votre spécialisation
        </h3>
        <p className="text-sm text-muted-foreground">
          Sélectionnez le type de service que vous souhaitez offrir
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableSpecializations.map((spec) => (
          <motion.div
            key={spec.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`p-6 cursor-pointer transition-all ${
                selectedSpecialization === spec.value
                  ? 'border-2 border-primary shadow-lg bg-primary/5'
                  : 'hover:shadow-md hover:border-primary/30'
              }`}
              onClick={() => onSpecializationSelect(spec.value)}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${spec.gradient} flex items-center justify-center text-white flex-shrink-0`}>
                  {spec.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-foreground mb-1">
                    {spec.label}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {spec.description}
                  </p>
                </div>

                {/* Selection indicator */}
                {selectedSpecialization === spec.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                  >
                    <span className="text-white text-sm font-bold">✓</span>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Info supplémentaire */}
      {selectedSpecialization && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 bg-muted">
            <p className="text-sm text-foreground text-center">
              Vous recevrez uniquement les commandes correspondant à{' '}
              <strong className="text-primary">
                {availableSpecializations.find(s => s.value === selectedSpecialization)?.label}
              </strong>
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
