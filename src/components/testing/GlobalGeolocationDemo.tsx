import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UniversalLocationSearch } from '@/components/location/UniversalLocationSearch';
import { CountryService } from '@/services/countryConfig';
import { Globe, MapPin, Clock, Star } from 'lucide-react';

interface TestLocation {
  address: string;
  coordinates: { lat: number; lng: number };
  type?: 'current' | 'saved' | 'recent' | 'search';
}

export const GlobalGeolocationDemo = () => {
  const [selectedLocation, setSelectedLocation] = useState<TestLocation | null>(null);
  const [currentCountry, setCurrentCountry] = useState(CountryService.getCurrentCountry());

  const handleLocationSelect = (location: TestLocation) => {
    setSelectedLocation(location);
    
    // Automatically update country context based on selected coordinates
    CountryService.autoDetectAndSetCountry(location.coordinates.lat, location.coordinates.lng);
    setCurrentCountry(CountryService.getCurrentCountry());
  };

  const testLocations = [
    { name: 'Paris, France', coords: { lat: 48.8566, lng: 2.3522 } },
    { name: 'New York, USA', coords: { lat: 40.7128, lng: -74.0060 } },
    { name: 'Tokyo, Japan', coords: { lat: 35.6762, lng: 139.6503 } },
    { name: 'Kinshasa, RDC', coords: { lat: -4.4419, lng: 15.2663 } },
    { name: 'Sydney, Australia', coords: { lat: -33.8688, lng: 151.2093 } },
    { name: 'London, UK', coords: { lat: 51.5074, lng: -0.1278 } }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Globe className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Système de Géolocalisation Mondiale</h1>
        </div>
        <p className="text-muted-foreground">
          Testez la recherche de lieux partout dans le monde avec suggestions intelligentes
        </p>
      </div>

      {/* Informations sur le pays actuel */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Pays détecté automatiquement</h3>
            <p className="text-sm text-muted-foreground">
              {currentCountry.name} ({currentCountry.code}) • {currentCountry.currency}
            </p>
          </div>
          <Badge variant={currentCountry.code === "*" ? "secondary" : "default"}>
            {currentCountry.code === "*" ? "Couverture Globale" : "Pays Spécifique"}
          </Badge>
        </div>
      </Card>

      {/* Interface de recherche universelle */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Recherche Universelle de Lieux
        </h3>
        
        <UniversalLocationSearch
          placeholder="Recherchez n'importe où dans le monde..."
          value={selectedLocation}
          onChange={handleLocationSelect}
          showCurrentLocation={true}
          showSavedPlaces={true}
          showRecentPlaces={true}
          className="mb-4"
        />

        {selectedLocation && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Lieu sélectionné :</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Adresse :</strong> {selectedLocation.address}
              </div>
              <div>
                <strong>Coordonnées :</strong> {selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}
              </div>
              <div>
                <strong>Type :</strong> 
                <Badge variant="outline" className="ml-2">
                  {selectedLocation.type === 'current' && <><Clock className="w-3 h-3 mr-1" />Position actuelle</>}
                  {selectedLocation.type === 'saved' && <><Star className="w-3 h-3 mr-1" />Lieu sauvegardé</>}
                  {selectedLocation.type === 'recent' && <><Clock className="w-3 h-3 mr-1" />Récent</>}
                  {selectedLocation.type === 'search' && <><MapPin className="w-3 h-3 mr-1" />Recherche</>}
                  {!selectedLocation.type && 'Inconnu'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Boutons de test rapide */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Test de Localisation Rapide</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {testLocations.map((location) => (
            <Button
              key={location.name}
              variant="outline"
              size="sm"
              onClick={() => handleLocationSelect({
                address: location.name,
                coordinates: location.coords,
                type: 'search'
              })}
              className="justify-start"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {location.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Statistiques des fonctionnalités */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fonctionnalités Implémentées</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Recherche mondiale avec Mapbox API
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Détection automatique de pays
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Support multilingue adaptatif
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Cache intelligent des résultats
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Géolocalisation GPS précise
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Fallback global automatique
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Suggestions par proximité
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Interface mobile-first responsive
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};