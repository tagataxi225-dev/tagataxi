/**
 * 🚗 Carte véhicule réutilisable
 */

import { Card } from '@/components/ui/card';
import { Car, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface VehicleCardProps {
  make: string;
  model: string;
  plate: string;
  color: string;
  photo?: string;
  capacity?: string;
  serviceType: 'taxi' | 'delivery';
}

export const VehicleCard = ({ 
  make, 
  model, 
  plate, 
  color, 
  photo,
  capacity,
  serviceType 
}: VehicleCardProps) => {
  const ServiceIcon = serviceType === 'taxi' ? Car : Package;
  const serviceColor = serviceType === 'taxi' ? 'blue' : 'green';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="p-6 service-card">
        <div className="flex items-center gap-2 mb-4">
          <ServiceIcon className={`w-5 h-5 text-${serviceColor}-500`} />
          <h3 className="font-semibold text-foreground">
            {serviceType === 'taxi' ? 'Véhicule actif' : 'Véhicule de livraison'}
          </h3>
        </div>

        <div className="flex gap-4">
          {photo ? (
            <img 
              src={photo} 
              alt={`${make} ${model}`}
              className="w-24 h-24 rounded-xl object-cover"
            />
          ) : (
            <div className={`w-24 h-24 rounded-xl bg-${serviceColor}-500/10 flex items-center justify-center`}>
              <ServiceIcon className={`w-12 h-12 text-${serviceColor}-500`} />
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Marque & Modèle</p>
              <p className="font-semibold text-foreground">{make} {model}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plaque d'immatriculation</p>
              <p className="font-mono font-semibold text-foreground">{plate}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Couleur</p>
                <p className="font-medium text-foreground">{color}</p>
              </div>
              {capacity && (
                <div>
                  <p className="text-sm text-muted-foreground">Capacité</p>
                  <p className="font-medium text-foreground">{capacity}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
