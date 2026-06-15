/**
 * Filtres avancés pour la recherche de livreurs
 * Permet de filtrer par type de véhicule, rating, distance, etc.
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Filter, 
  Star, 
  MapPin, 
  Truck, 
  Car, 
  Bike,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DriverFilters {
  vehicleTypes: string[];
  minRating: number;
  maxDistance: number;
  maxPrice: number;
  onlyVerified: boolean;
}

interface EnhancedDriverFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DriverFilters;
  onFiltersChange: (filters: DriverFilters) => void;
  onApply: () => void;
}

const vehicleOptions = [
  { id: 'moto', label: 'Moto', icon: <Bike className="w-4 h-4" />, emoji: '🏍️' },
  { id: 'car', label: 'Voiture', icon: <Car className="w-4 h-4" />, emoji: '🚗' },
  { id: 'truck', label: 'Camion', icon: <Truck className="w-4 h-4" />, emoji: '🚛' }
];

export const EnhancedDriverFilters: React.FC<EnhancedDriverFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply
}) => {
  const [localFilters, setLocalFilters] = useState<DriverFilters>(filters);

  const handleVehicleToggle = (vehicleType: string) => {
    const newTypes = localFilters.vehicleTypes.includes(vehicleType)
      ? localFilters.vehicleTypes.filter(t => t !== vehicleType)
      : [...localFilters.vehicleTypes, vehicleType];
    
    setLocalFilters(prev => ({ ...prev, vehicleTypes: newTypes }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onApply();
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters: DriverFilters = {
      vehicleTypes: [],
      minRating: 0,
      maxDistance: 20,
      maxPrice: 50000,
      onlyVerified: false
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFiltersCount = [
    localFilters.vehicleTypes.length > 0,
    localFilters.minRating > 0,
    localFilters.maxDistance < 20,
    localFilters.onlyVerified
  ].filter(Boolean).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Filtres</h3>
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Types de véhicules */}
                  <div>
                    <h4 className="font-medium mb-3">Type de véhicule</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {vehicleOptions.map((vehicle) => (
                        <button
                          key={vehicle.id}
                          onClick={() => handleVehicleToggle(vehicle.id)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            localFilters.vehicleTypes.includes(vehicle.id)
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{vehicle.emoji}</div>
                          <div className="text-xs font-medium">{vehicle.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating minimum */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Rating minimum</h4>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                          {localFilters.minRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <Slider
                      value={[localFilters.minRating]}
                      onValueChange={([value]) => 
                        setLocalFilters(prev => ({ ...prev, minRating: value }))
                      }
                      max={5}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0.0</span>
                      <span>5.0</span>
                    </div>
                  </div>

                  {/* Distance maximum */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Distance maximum</h4>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {localFilters.maxDistance} km
                        </span>
                      </div>
                    </div>
                    <Slider
                      value={[localFilters.maxDistance]}
                      onValueChange={([value]) => 
                        setLocalFilters(prev => ({ ...prev, maxDistance: value }))
                      }
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1 km</span>
                      <span>50 km</span>
                    </div>
                  </div>

                  {/* Livreurs vérifiés uniquement */}
                  <div>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <h4 className="font-medium">Livreurs vérifiés uniquement</h4>
                        <p className="text-sm text-muted-foreground">
                          Afficher seulement les livreurs avec documents validés
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={localFilters.onlyVerified}
                        onChange={(e) => 
                          setLocalFilters(prev => ({ ...prev, onlyVerified: e.target.checked }))
                        }
                        className="w-4 h-4 text-primary"
                      />
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8">
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="flex-1"
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    onClick={handleApplyFilters}
                    className="flex-1"
                  >
                    Appliquer {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedDriverFilters;