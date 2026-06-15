import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Star, 
  Phone, 
  MessageCircle, 
  User,
  Car,
  Navigation2,
  Zap,
  Search,
  Timer,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

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

interface ModernDriverSearchProps {
  isSearching: boolean;
  drivers: Driver[];
  estimatedPrice: number;
  onDriverSelect: (driverId: string) => void;
  onCancel: () => void;
  onExpandRadius?: () => void;
}

const ModernDriverSearch: React.FC<ModernDriverSearchProps> = ({
  isSearching,
  drivers,
  estimatedPrice,
  onDriverSelect,
  onCancel,
  onExpandRadius
}) => {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driversFound, setDriversFound] = useState(0);
  const [searchDuration, setSearchDuration] = useState(0);

  // Auto-select closest driver and simulate search animation
  useEffect(() => {
    if (!isSearching && drivers.length > 0 && !selectedDriver) {
      setSelectedDriver(drivers[0]);
      setDriversFound(drivers.length);
    }
  }, [isSearching, drivers, selectedDriver]);

  // Search timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchDuration(prev => prev + 1);
      }, 1000);
    } else {
      setSearchDuration(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const handleConfirmDriver = () => {
    if (selectedDriver) {
      onDriverSelect(selectedDriver.driver_id);
      toast.success(`Chauffeur confirmé: ${selectedDriver.driver_profile.vehicle_make} ${selectedDriver.driver_profile.vehicle_model}`);
    }
  };

  // Radar animation for search state
  if (isSearching) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Radar Animation */}
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{
                    scale: [1, 1.5, 2],
                    opacity: [1, 0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-secondary"
                  animate={{
                    scale: [1, 1.5, 2],
                    opacity: [1, 0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.5,
                    ease: "easeOut"
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Recherche de chauffeurs...</h3>
                <p className="text-muted-foreground">
                  Nous recherchons les meilleurs chauffeurs disponibles près de vous
                </p>
                
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <Timer className="w-4 h-4" />
                  <span>{searchDuration}s</span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prix estimé:</span>
                  <span className="font-semibold text-lg text-primary">
                    {formatCurrency(estimatedPrice)}
                  </span>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={onCancel}
                className="w-full"
              >
                Annuler la recherche
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No drivers found state
  if (drivers.length === 0) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                <MapPin className="w-10 h-10 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Aucun chauffeur disponible</h3>
                <p className="text-muted-foreground">
                  Aucun chauffeur n'est disponible dans votre zone en ce moment
                </p>
              </div>

              <div className="space-y-3">
                {onExpandRadius && (
                  <Button 
                    onClick={onExpandRadius}
                    className="w-full"
                    variant="default"
                  >
                    <Navigation2 className="w-4 h-4 mr-2" />
                    Élargir la zone de recherche
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="w-full"
                >
                  Réessayer plus tard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Drivers found - show results
  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Header with count */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <h3 className="text-xl font-bold text-foreground">Chauffeurs trouvés</h3>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {driversFound}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Sélectionnez votre chauffeur préféré
        </p>
      </div>

      {/* Drivers list */}
      <div className="space-y-3">
        <AnimatePresence>
          {drivers.map((driver, index) => {
            const isSelected = selectedDriver?.driver_id === driver.driver_id;
            const isClosest = index === 0;
            
            return (
              <motion.div
                key={driver.driver_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-300 relative overflow-hidden ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5 shadow-lg' 
                      : 'hover:shadow-md hover:scale-[1.02]'
                  }`}
                  onClick={() => handleDriverSelect(driver)}
                >
                  {isClosest && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-secondary text-secondary-foreground text-xs">
                        <Zap className="w-3 h-3 mr-1" />
                        Plus proche
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Driver Avatar */}
                      <div className="relative">
                        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                          <Car className="w-7 h-7 text-primary" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Driver Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-foreground truncate">
                            {driver.driver_profile.vehicle_make} {driver.driver_profile.vehicle_model}
                          </h4>
                          <div className="text-right">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {driver.estimated_arrival} min
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {driver.driver_profile.vehicle_plate} • {driver.driver_profile.vehicle_color}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-sm ml-1 font-medium">
                                {driver.driver_profile.rating_average.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              {driver.distance.toFixed(1)} km
                            </div>
                          </div>
                          
                          {isSelected && (
                            <ChevronRight className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick actions when selected */}
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <div className="flex space-x-2">
                          <Button 
                            className="flex-1"
                            onClick={handleConfirmDriver}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Confirmer - {formatCurrency(estimatedPrice)}
                          </Button>
                          <Button variant="outline" size="icon">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Cancel button */}
      <Button 
        variant="outline" 
        onClick={onCancel} 
        className="w-full mt-4"
      >
        Annuler la recherche
      </Button>
    </div>
  );
};

export default ModernDriverSearch;