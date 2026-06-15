/**
 * Formulaire de réservation amélioré avec support multi-villes
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeftRight, Clock, MapPin } from 'lucide-react';
import { SmartLocationPicker } from '@/components/location/SmartLocationPicker';
import { SmartCitySelector } from '@/components/booking/SmartCitySelector';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { LocationData } from '@/types/location';
import { type CityConfig } from '@/types/unifiedLocation';
import { cityDetectionService } from '@/services/cityDetectionService';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';

interface EnhancedBookingFormProps {
  onSubmit: (data: BookingData) => void;
  disabled?: boolean;
  className?: string;
}

interface BookingData {
  pickup: LocationData;
  destination: LocationData;
  city: string;
  estimatedPrice: number;
  estimatedDuration: number;
  distance: number;
}

export const EnhancedBookingForm: React.FC<EnhancedBookingFormProps> = ({
  onSubmit,
  disabled = false,
  className = ''
}) => {
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityConfig | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [calculating, setCalculating] = useState(false);

  const { calculateDistance } = useSmartGeolocation();

  // Auto-détecter position actuelle pour pickup via nativeGeolocationService (Android/iOS/Safari)
  useEffect(() => {
    if (!pickup) {
      nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Force GPS hardware frais — pas de cache réseau imprécis
      }).then((position) => {
        setPickup({
          address: 'Position actuelle',
          lat: position.lat,
          lng: position.lng,
          type: 'current'
        });
      }).catch((error) => {
        console.warn('Géolocalisation échouée:', error);
      });
    }
  }, [pickup]);

  // Calculer prix et durée quand pickup et destination changent
  useEffect(() => {
    if (pickup && destination && selectedCity) {
      calculatePriceAndDuration();
    }
  }, [pickup, destination, selectedCity]);

  const calculatePriceAndDuration = () => {
    if (!pickup || !destination || !selectedCity) return;

    setCalculating(true);

    try {
      // Calculer distance (using Haversine formula)
      const R = 6371; // Rayon de la Terre en km
      const dLat = (destination.lat - pickup.lat) * Math.PI / 180;
      const dLng = (destination.lng - pickup.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pickup.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      setDistance(dist);

      // Obtenir config tarifs pour la ville
      const pricingConfig = cityDetectionService.getCityPricingConfig(selectedCity);
      
      // Calculs de base
      const baseFare = 2000; // CDF
      const perKmRate = 500; // CDF
      let calculatedPrice = baseFare + (dist * perKmRate);

      // Appliquer multiplicateur de ville
      calculatedPrice *= pricingConfig.basePriceMultiplier;

      // Durée estimée (vitesse moyenne 25 km/h en ville)
      const estimatedTime = Math.max(10, (dist / 25) * 60); // minutes

      setEstimatedPrice(Math.round(calculatedPrice));
      setEstimatedDuration(Math.round(estimatedTime));

    } catch (error) {
      console.error('Erreur calcul prix:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleSwapLocations = () => {
    if (pickup && destination) {
      const temp = pickup;
      setPickup(destination);
      setDestination(temp);
    }
  };

  const handleSubmit = () => {
    if (!pickup || !destination || !selectedCity) return;

    const bookingData: BookingData = {
      pickup,
      destination,
      city: selectedCity.name,
      estimatedPrice,
      estimatedDuration,
      distance
    };

    onSubmit(bookingData);
  };

  const isReadyToBook = pickup && destination && selectedCity && estimatedPrice > 0;

  return (
    <Card className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Réserver un trajet</h2>
          <p className="text-sm text-muted-foreground">
            Transport rapide et fiable
          </p>
        </div>
      </div>

      {/* Sélecteur de ville */}
      <SmartCitySelector
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        autoDetect={true}
        showDetectionInfo={true}
      />

      {/* Locations */}
      <div className="space-y-4">
        {/* Pickup */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Point de départ
          </label>
          <SmartLocationPicker
            value={pickup}
            onChange={setPickup}
            placeholder="D'où partez-vous ?"
            context="pickup"
          />
        </div>

        {/* Swap button */}
        {pickup && destination && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwapLocations}
              className="rounded-full w-10 h-10 p-0"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Destination */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Destination
          </label>
          <SmartLocationPicker
            value={destination}
            onChange={setDestination}
            placeholder="Où allez-vous ?"
            context="delivery"
          />
        </div>
      </div>

      {/* Estimation */}
      {(pickup && destination && selectedCity) && (
        <div className="bg-primary/5 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Estimation automatique</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold">
                {calculating ? '...' : `${distance.toFixed(1)} km`}
              </div>
              <div className="text-xs text-muted-foreground">Distance</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {calculating ? '...' : `${estimatedDuration} min`}
              </div>
              <div className="text-xs text-muted-foreground">Durée</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-primary">
                {calculating ? '...' : `${estimatedPrice.toLocaleString()} ${selectedCity.currency}`}
              </div>
              <div className="text-xs text-muted-foreground">Prix estimé</div>
            </div>
          </div>
        </div>
      )}

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!isReadyToBook || disabled || calculating}
        className="w-full h-12"
        size="lg"
      >
        {calculating ? (
          'Calcul en cours...'
        ) : isReadyToBook ? (
          `Réserver - ${estimatedPrice.toLocaleString()} ${selectedCity?.currency || 'CDF'}`
        ) : (
          'Compléter les informations'
        )}
      </Button>

      {/* Info ville */}
      {selectedCity && selectedCity.name !== 'Kinshasa' && (
        <div className="text-xs text-center text-muted-foreground">
          💡 Tarifs adaptés pour {selectedCity.name}
          {selectedCity.name === 'Lubumbashi' && ' (+20%)'}
          {selectedCity.name === 'Kolwezi' && ' (+10%)'}
        </div>
      )}
    </Card>
  );
};