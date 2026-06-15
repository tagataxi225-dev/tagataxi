import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Star, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DriverProfile {
  user_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  rating_average: number;
  rating_count: number;
}

interface Driver {
  driver_id: string;
  distance: number;
  estimated_arrival: number;
  driver_profile: DriverProfile;
}

interface DriverMatcherProps {
  isSearching: boolean;
  drivers: Driver[];
  onDriverSelect: (driverId: string) => void;
  onCancel: () => void;
}

const DriverMatcher: React.FC<DriverMatcherProps> = ({
  isSearching,
  drivers,
  onDriverSelect,
  onCancel
}) => {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Auto-select the closest driver after search is complete
  useEffect(() => {
    if (!isSearching && drivers.length > 0 && !selectedDriver) {
      setSelectedDriver(drivers[0]);
      // Auto assign after 2 seconds
      setTimeout(() => {
        onDriverSelect(drivers[0].driver_id);
      }, 2000);
    }
  }, [isSearching, drivers, selectedDriver, onDriverSelect]);

  if (isSearching) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-lg font-semibold">Recherche de chauffeurs...</h3>
            <p className="text-muted-foreground">
              Nous cherchons le meilleur chauffeur disponible près de vous
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (drivers.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Aucun chauffeur disponible</h3>
            <p className="text-muted-foreground">
              Aucun chauffeur n'est disponible dans votre zone en ce moment
            </p>
            <Button onClick={onCancel} variant="outline">
              Réessayer plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Chauffeurs disponibles</h3>
      
      {drivers.map((driver) => (
        <Card 
          key={driver.driver_id}
          className={`cursor-pointer transition-all ${
            selectedDriver?.driver_id === driver.driver_id 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedDriver(driver)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                
                <div>
                  <h4 className="font-medium">
                    {driver.driver_profile.vehicle_make} {driver.driver_profile.vehicle_model}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {driver.driver_profile.vehicle_plate} • {driver.driver_profile.vehicle_color}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-sm ml-1">
                        {driver.driver_profile.rating_average.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {driver.driver_profile.rating_count} avis
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  {driver.estimated_arrival} min
                </div>
                <p className="text-sm text-muted-foreground">
                  {driver.distance.toFixed(1)} km
                </p>
              </div>
            </div>
            
            {selectedDriver?.driver_id === driver.driver_id && (
              <div className="mt-4 pt-4 border-t flex space-x-2">
                <Button 
                  className="flex-1"
                  onClick={() => onDriverSelect(driver.driver_id)}
                >
                  Confirmer ce chauffeur
                </Button>
                <Button variant="outline" size="icon">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      <Button variant="outline" onClick={onCancel} className="w-full">
        Annuler la recherche
      </Button>
    </div>
  );
};

export default DriverMatcher;