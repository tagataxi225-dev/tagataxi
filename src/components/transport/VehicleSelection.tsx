import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Car, Bike, Leaf, Clock, Users, Wifi, Snowflake } from 'lucide-react';
import { usePricingRules } from '@/hooks/usePricingRules';

interface Vehicle {
  id: string;
  name: string;
  description: string;
  price: number;
  basePrice: number;
  estimatedTime: number;
  available: boolean;
  icon: any;
  features: string[];
  capacity: number;
  eco?: boolean;
  multiplier: number;
}

interface VehicleSelectionProps {
  distance: number;
  onVehicleSelect: (vehicle: Vehicle) => void;
  selectedVehicleId?: string;
}

const VehicleSelection = ({ distance, onVehicleSelect, selectedVehicleId }: VehicleSelectionProps) => {
  const [vehicles] = useState<Vehicle[]>([
    {
      id: 'eco',
      name: 'Tembea Eco',
      description: 'Voiture économique, parfait pour trajets quotidiens',
      basePrice: 500,
      price: 0,
      estimatedTime: 8,
      available: true,
      icon: Car,
      features: ['Économique', 'Sièges standards'],
      capacity: 4,
      eco: true,
      multiplier: 1.0
    },
    {
      id: 'standard',
      name: 'Tembea Standard',
      description: 'Voiture confortable avec climatisation',
      basePrice: 750,
      price: 0,
      estimatedTime: 10,
      available: true,
      icon: Car,
      features: ['Climatisation', 'Sièges confortables'],
      capacity: 4,
      multiplier: 1.5
    },
    {
      id: 'premium',
      name: 'Tembea Premium',
      description: 'Voiture haut de gamme avec WiFi',
      basePrice: 1200,
      price: 0,
      estimatedTime: 15,
      available: true,
      icon: Car,
      features: ['WiFi gratuit', 'Sièges en cuir', 'Climatisation'],
      capacity: 4,
      multiplier: 2.3
    },
    {
      id: 'moto',
      name: 'Tembea Moto',
      description: 'Moto rapide pour éviter les embouteillages',
      basePrice: 300,
      price: 0,
      estimatedTime: 5,
      available: true,
      icon: Bike,
      features: ['Très rapide', 'Évite embouteillages'],
      capacity: 1,
      multiplier: 0.6
    }
  ]);

  const { rules } = usePricingRules();

  // Calcul du prix en fonction de la distance
  const calculatePrice = (vehicle: Vehicle) => {
    const distanceKm = Math.max(distance, 0);
    const rule = rules.find(r => r.service_type === 'transport' && r.vehicle_class === vehicle.id);
    if (rule) {
      return Math.round((Number(rule.base_price) || 0) + distanceKm * (Number(rule.price_per_km) || 0));
    }
    // Fallback to legacy computation if no rule found
    const pricePerKm = 150; // legacy default
    return Math.round(vehicle.basePrice + (distanceKm * pricePerKm * vehicle.multiplier));
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'WiFi gratuit':
        return <Wifi className="h-3 w-3" />;
      case 'Climatisation':
        return <Snowflake className="h-3 w-3" />;
      case 'Économique':
        return <Leaf className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-grey-900">Choisir un véhicule</h3>
        {distance > 0 && (
          <p className="text-sm text-grey-600">
            Distance: {distance.toFixed(1)} km
          </p>
        )}
      </div>

      {vehicles.map((vehicle) => {
        const finalPrice = calculatePrice(vehicle);
        const isSelected = selectedVehicleId === vehicle.id;
        
        return (
          <div
            key={vehicle.id}
            onClick={() => onVehicleSelect({ ...vehicle, price: finalPrice })}
            className={`p-4 bg-card rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-sm ${
              isSelected 
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                : 'border-grey-100 hover:border-grey-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-primary' : 'bg-grey-100'
                }`}>
                  <vehicle.icon className={`h-6 w-6 ${
                    isSelected ? 'text-white' : 'text-grey-600'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-grey-900">{vehicle.name}</h4>
                    {vehicle.eco && <Leaf className="h-4 w-4 text-green-500" />}
                    {!vehicle.available && (
                      <span className="text-xs bg-grey-200 text-grey-600 px-2 py-1 rounded">
                        Indisponible
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-grey-600 mb-2">{vehicle.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-grey-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{vehicle.estimatedTime} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{vehicle.capacity} places</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {vehicle.features.slice(0, 2).map((feature, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs bg-grey-50 px-2 py-1 rounded">
                        {getFeatureIcon(feature)}
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-primary">
                  {finalPrice.toLocaleString()}
                </p>
                <p className="text-xs text-grey-500">CDF</p>
                {distance > 0 && (
                  <p className="text-xs text-grey-400 mt-1">
                    ~{(finalPrice / distance).toFixed(0)} CDF/km
                  </p>
                )}
              </div>
            </div>
            
            {isSelected && vehicle.features.length > 2 && (
              <div className="mt-3 pt-3 border-t border-grey-100">
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.slice(2).map((feature, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {getFeatureIcon(feature)}
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 <strong>Astuce:</strong> Les prix peuvent varier selon la demande et l'heure de la journée.
        </p>
      </div>
    </div>
  );
};

export default VehicleSelection;