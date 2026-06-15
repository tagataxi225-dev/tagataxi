import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { CountryService } from '@/services/countryConfig';
import { 
  Car, 
  Bike, 
  Bus, 
  Truck, 
  MapPin, 
  Clock, 
  Star, 
  Users,
  Fuel,
  Route
} from 'lucide-react';

interface CongoVehicle {
  id: string;
  name: string;
  type: 'taxi_voiture' | 'taxi_bus' | 'moto_taxi' | 'bus_transco' | 'transport_commun';
  capacity: number;
  pricePerKm: number;
  estimatedTime: string;
  features: string[];
  available: boolean;
  description: string;
  culturalNote?: string;
}

interface CongoVehicleSelectionProps {
  distance: number;
  onVehicleSelect: (vehicle: CongoVehicle) => void;
  selectedVehicleId?: string;
}

const CongoVehicleSelection: React.FC<CongoVehicleSelectionProps> = ({
  distance,
  onVehicleSelect,
  selectedVehicleId
}) => {
  const { t, formatCurrency } = useLanguage();
  const { currentCity } = useGeolocation();

  // Coefficients de prix par ville
  const CITY_PRICE_MULTIPLIERS = {
    kinshasa: 1.0,
    lubumbashi: 1.2, // 20% plus cher
    kolwezi: 1.1     // 10% plus cher
  };

  const getVehiclesByCity = (city: string): CongoVehicle[] => {
    const cityKey = ['kinshasa', 'lubumbashi', 'kolwezi'].includes(city) ? city : 'kinshasa';
    const multiplier = CITY_PRICE_MULTIPLIERS[cityKey as keyof typeof CITY_PRICE_MULTIPLIERS] || 1.0;
    
    return [
    {
      id: 'moto_taxi',
      name: t('transport.moto_taxi'),
      type: 'moto_taxi',
      capacity: cityKey === 'kolwezi' ? 1 : 2,
      pricePerKm: Math.round(150 * multiplier),
      estimatedTime: city === 'lubumbashi' ? '8-12 min' : '10-15 min',
      features: ['Rapide', 'Économique', 'Flexible'],
      available: cityKey !== 'kolwezi', // Moins commun à Kolwezi
      description: 'Idéal pour les courtes distances et éviter les embouteillages',
      culturalNote: cityKey === 'kinshasa' ? 'Transport populaire à Kinshasa pour sa rapidité' :
                   cityKey === 'lubumbashi' ? 'Service rapide dans Lubumbashi' :
                   'Service limité dans la ville minière'
    },
    {
      id: 'taxi_voiture',
      name: t('transport.taxi_voiture'),
      type: 'taxi_voiture',
      capacity: 4,
      pricePerKm: Math.round(300 * multiplier),
      estimatedTime: cityKey === 'kolwezi' ? '10-20 min' : '15-25 min',
      features: ['Confortable', 'Climatisé', 'Sécurisé'],
      available: true,
      description: 'Transport privé confortable pour 1-4 personnes',
      culturalNote: cityKey === 'kinshasa' ? 'Service premium pour les trajets en ville' :
                   cityKey === 'lubumbashi' ? 'Transport de qualité dans la capitale du Katanga' :
                   'Service adapté aux déplacements urbains de Kolwezi'
    },
    {
      id: 'taxi_bus',
      name: t('transport.taxi_bus'),
      type: 'taxi_bus',
      capacity: cityKey === 'kinshasa' ? 12 : cityKey === 'lubumbashi' ? 10 : 8,
      pricePerKm: Math.round(100 * multiplier),
      estimatedTime: cityKey === 'kolwezi' ? '15-25 min' : '20-30 min',
      features: ['Économique', 'Route fixe', 'Populaire'],
      available: cityKey !== 'kolwezi', // Service limité à Kolwezi
      description: 'Transport collectif sur itinéraires fixes',
      culturalNote: cityKey === 'kinshasa' ? 'Moyen de transport le plus utilisé par les Kinois' :
                   cityKey === 'lubumbashi' ? 'Transport collectif populaire à Lubumbashi' :
                   'Service de transport collectif adapté'
    },
    {
      id: 'bus_transco',
      name: t('transport.bus_transco'),
      type: 'bus_transco',
      capacity: cityKey === 'kinshasa' ? 40 : cityKey === 'lubumbashi' ? 35 : 25,
      pricePerKm: Math.round(80 * multiplier),
      estimatedTime: cityKey === 'kolwezi' ? '20-35 min' : '30-45 min',
      features: ['Très économique', 'Grande capacité', 'Service public'],
      available: cityKey === 'kinshasa', // Principalement à Kinshasa
      description: 'Bus de transport en commun de la ville',
      culturalNote: cityKey === 'kinshasa' ? 'Transport officiel de la ville de Kinshasa' :
                   'Service de transport en commun local'
    }
  ];
  };

  const congoVehicles = getVehiclesByCity(typeof currentCity === 'string' ? currentCity : currentCity?.code || 'kinshasa');

  const calculatePrice = (vehicle: CongoVehicle): number => {
    const basePrice = vehicle.pricePerKm * distance;
    const minPrice = vehicle.type === 'moto_taxi' ? 500 : 
                     vehicle.type === 'taxi_voiture' ? 1000 :
                     vehicle.type === 'taxi_bus' ? 300 : 200;
    return Math.max(basePrice, minPrice);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'moto_taxi': return <Bike className="h-6 w-6" />;
      case 'taxi_voiture': return <Car className="h-6 w-6" />;
      case 'taxi_bus': return <Bus className="h-6 w-6" />;
      case 'bus_transco': return <Truck className="h-6 w-6" />;
      default: return <Car className="h-6 w-6" />;
    }
  };

  const getVehicleColor = (type: string) => {
    switch (type) {
      case 'moto_taxi': return 'text-congo-yellow';
      case 'taxi_voiture': return 'text-primary';
      case 'taxi_bus': return 'text-congo-red';
      case 'bus_transco': return 'text-foreground';
      default: return 'text-primary';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choisissez votre transport</h3>
        <p className="text-sm text-muted-foreground">
          Distance: {distance.toFixed(1)} km • Options adaptées à {(typeof currentCity === 'string' ? currentCity : currentCity?.name || 'Kinshasa').charAt(0).toUpperCase() + (typeof currentCity === 'string' ? currentCity : currentCity?.name || 'Kinshasa').slice(1)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {congoVehicles.map((vehicle) => {
          const price = calculatePrice(vehicle);
          const isSelected = selectedVehicleId === vehicle.id;
          
          return (
            <Card 
              key={vehicle.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md cultural-card ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              } ${!vehicle.available ? 'opacity-50' : ''}`}
              onClick={() => vehicle.available && onVehicleSelect(vehicle)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Vehicle Icon */}
                  <div className={`p-3 rounded-lg bg-muted ${getVehicleColor(vehicle.type)}`}>
                    {getVehicleIcon(vehicle.type)}
                  </div>

                  {/* Vehicle Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-base">{vehicle.name}</h4>
                        <p className="text-sm text-muted-foreground">{vehicle.description}</p>
                      </div>
                      {!vehicle.available && (
                        <Badge variant="secondary">Indisponible</Badge>
                      )}
                    </div>

                    {/* Cultural Note */}
                    {vehicle.culturalNote && (
                      <div className="p-2 bg-congo-yellow/10 rounded-md border-l-2 border-congo-yellow">
                        <p className="text-xs text-foreground">{vehicle.culturalNote}</p>
                      </div>
                    )}

                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {vehicle.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{vehicle.capacity} places</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{vehicle.estimatedTime}</span>
                      </div>
                    </div>

                    {/* Price Display */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 fill-congo-yellow text-congo-yellow" />
                        <span className="text-sm">4.{Math.floor(Math.random() * 5) + 5}/5</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {formatCurrency(price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(vehicle.pricePerKm)}/km
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    {vehicle.available && (
                      <Button 
                        className={`w-full touch-friendly ${
                          isSelected ? 'bg-primary' : 'bg-gradient-congo'
                        }`}
                        disabled={!vehicle.available}
                      >
                        {isSelected ? 'Sélectionné' : 'Choisir ce transport'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Transport Info */}
      <Card className="bg-gradient-cultural">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-primary mt-1" />
            <div>
              <h4 className="font-medium mb-1">Transport à {(typeof currentCity === 'string' ? currentCity : currentCity?.name || 'Kinshasa').charAt(0).toUpperCase() + (typeof currentCity === 'string' ? currentCity : currentCity?.name || 'Kinshasa').slice(1)}</h4>
              <p className="text-sm text-muted-foreground">
                Nos tarifs sont adaptés au marché local et incluent tous les frais.
                Paiement en francs congolais (CDF) ou dollars US.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CongoVehicleSelection;