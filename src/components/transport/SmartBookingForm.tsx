/**
 * 🚗 FORMULAIRE DE RÉSERVATION INTELLIGENT
 * 
 * Interface optimisée pour réservation taxi en 2 clics
 * Géolocalisation automatique et calcul de prix en temps réel
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SmartLocationPicker } from '@/components/location/SmartLocationPicker';
import { useSmartGeolocation, LocationData } from '@/hooks/useSmartGeolocation';
import { 
  ArrowUpDown, 
  Navigation, 
  Clock, 
  Calculator, 
  CheckCircle2,
  MapPin,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartBookingFormProps {
  onSubmit: (bookingData: BookingData) => void;
  disabled?: boolean;
  className?: string;
}

interface BookingData {
  pickup: LocationData;
  destination: LocationData;
  estimatedPrice: number;
  estimatedDuration: number;
  distance: number;
}

export const SmartBookingForm: React.FC<SmartBookingFormProps> = ({
  onSubmit,
  disabled = false,
  className
}) => {
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const { getCurrentPosition, calculateDistance, formatDistance, loading } = useSmartGeolocation();

  // Auto-détection position pickup au chargement
  useEffect(() => {
    const autoDetectPickup = async () => {
      try {
        const position = await getCurrentPosition({
          timeout: 10000,
          fallbackToIP: true,
          fallbackToDefault: true
        });
        setPickup(position);
      } catch (error) {
        console.log('Auto-detection failed, user will select manually');
      }
    };

    autoDetectPickup();
  }, [getCurrentPosition]);

  // Calcul automatique prix et durée
  useEffect(() => {
    if (pickup && destination) {
      calculatePriceAndDuration();
    }
  }, [pickup, destination]);

  const calculatePriceAndDuration = async () => {
    if (!pickup || !destination) return;

    setIsCalculating(true);
    
    try {
      // Calculer distance
      const distanceMeters = calculateDistance(
        { lat: pickup.lat, lng: pickup.lng },
        { lat: destination.lat, lng: destination.lng }
      );
      
      const distanceKm = distanceMeters / 1000;
      setDistance(distanceKm);

      // Calculer prix estimé (tarification Kinshasa)
      const basePrice = 2000; // CDF
      const pricePerKm = 500; // CDF
      const calculatedPrice = basePrice + (distanceKm * pricePerKm);
      setEstimatedPrice(Math.round(calculatedPrice));

      // Calculer durée estimée (vitesse moyenne 20 km/h en ville)
      const estimatedMinutes = Math.max(5, Math.round((distanceKm / 20) * 60));
      setEstimatedDuration(estimatedMinutes);

    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  };

  const handleSubmit = () => {
    if (!pickup || !destination) return;

    const bookingData: BookingData = {
      pickup,
      destination,
      estimatedPrice,
      estimatedDuration,
      distance
    };

    onSubmit(bookingData);
  };

  const isReadyToBook = pickup && destination && estimatedPrice > 0;

  return (
    <Card className={cn("p-6 space-y-6 bg-gradient-to-br from-background to-background/50", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Navigation className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Réserver un taxi</h3>
          <p className="text-sm text-muted-foreground">Géolocalisation intelligente</p>
        </div>
      </div>

      {/* Formulaire de localisation */}
      <div className="space-y-4">
        {/* Point de départ */}
        <div className="relative">
          <SmartLocationPicker
            value={pickup}
            onChange={setPickup}
            label="📍 Point de départ"
            placeholder="D'où partez-vous ?"
            context="pickup"
            showAccuracy={true}
            disabled={disabled}
          />
          
        </div>

        {/* Bouton d'échange */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleSwapLocations}
            disabled={!pickup || !destination}
            className="rounded-full border-2 hover:border-primary transition-all duration-200"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Destination */}
        <SmartLocationPicker
          value={destination}
          onChange={setDestination}
          label="🎯 Destination"
          placeholder="Où allez-vous ?"
          context="delivery"
          disabled={disabled}
        />
      </div>

      {/* Estimation automatique */}
      {(pickup && destination) && (
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Estimation automatique</span>
            {isCalculating && (
              <div className="animate-pulse text-xs text-primary">Calcul en cours...</div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Distance</div>
              <div className="font-semibold text-primary">
                {formatDistance(distance * 1000)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Durée</div>
              <div className="font-semibold text-primary flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {estimatedDuration}min
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Prix estimé</div>
              <div className="font-semibold text-primary">
                {estimatedPrice.toLocaleString()} CDF
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={!isReadyToBook || disabled || isCalculating}
          className={cn(
            "w-full h-12 font-semibold text-base transition-all duration-200",
            isReadyToBook 
              ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30" 
              : "bg-muted text-muted-foreground"
          )}
        >
          {isCalculating ? (
            <>
              <Calculator className="mr-2 h-4 w-4 animate-pulse" />
              Calcul en cours...
            </>
          ) : isReadyToBook ? (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Réserver maintenant • {estimatedPrice.toLocaleString()} CDF
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Sélectionnez vos adresses
            </>
          )}
        </Button>

        {isReadyToBook && (
          <div className="text-xs text-center text-muted-foreground">
            🚗 Un chauffeur vous sera assigné automatiquement
          </div>
        )}
      </div>
    </Card>
  );
};