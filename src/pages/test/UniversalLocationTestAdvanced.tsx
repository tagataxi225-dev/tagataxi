import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Globe, Smartphone } from 'lucide-react';
import { UniversalLocationPicker } from '@/components/location/UniversalLocationPicker';
import { universalGeolocation, SUPPORTED_CITIES } from '@/services/universalGeolocation';
import { ipGeolocation } from '@/services/ipGeolocation';
import type { LocationData } from '@/types/location';

const TEST_COORDINATES = {
  kinshasa: { lat: -4.3217, lng: 15.3069 },
  lubumbashi: { lat: -11.6792, lng: 27.4896 },
  kolwezi: { lat: -10.7056, lng: 25.4664 },
};

export default function UniversalLocationTestAdvanced() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [detectedCity, setDetectedCity] = useState('');
  const [ipLocation, setIpLocation] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${result}`, ...prev.slice(0, 9)]);
  };

  const testCityDetection = async (testCoords?: { lat: number; lng: number }) => {
    try {
      const start = Date.now();
      const city = await universalGeolocation.detectUserCity(testCoords);
      const duration = Date.now() - start;
      
      setDetectedCity(`${city.name} (${city.countryCode}) - ${duration}ms`);
      addTestResult(`✅ Ville détectée: ${city.name} en ${duration}ms`);
    } catch (error) {
      addTestResult(`❌ Erreur détection ville: ${error}`);
    }
  };

  const testIPGeolocation = async () => {
    try {
      const start = Date.now();
      const location = await ipGeolocation.getCurrentLocation();
      const duration = Date.now() - start;
      
      setIpLocation(`${location.city}, ${location.country} via ${location.provider} - ${duration}ms`);
      addTestResult(`✅ IP Geo: ${location.city} (${location.provider}) en ${duration}ms`);
    } catch (error) {
      addTestResult(`❌ Erreur IP Geo: ${error}`);
    }
  };

  const testAllCities = async () => {
    addTestResult('🧪 Test de toutes les villes...');
    
    for (const [cityCode, coords] of Object.entries(TEST_COORDINATES)) {
      try {
        const start = Date.now();
        const city = await universalGeolocation.detectUserCity(coords);
        const duration = Date.now() - start;
        
        const isCorrect = city.code === cityCode;
        addTestResult(`${isCorrect ? '✅' : '❌'} ${cityCode.toUpperCase()}: ${city.name} (${duration}ms)`);
      } catch (error) {
        addTestResult(`❌ ${cityCode.toUpperCase()}: Erreur`);
      }
    }
  };

  const clearCache = () => {
    universalGeolocation.clearCache();
    localStorage.removeItem('smartGeolocation_cache');
    addTestResult('🗑️ Cache nettoyé');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Test Géolocalisation Universelle
          </h1>
          <p className="text-muted-foreground">
            Test avancé du système de détection de ville et géolocalisation
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Ville Détectée</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {detectedCity || 'Non détectée'}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">IP Géolocalisation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {ipLocation || 'Non testée'}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Position Sélectionnée</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedLocation ? selectedLocation.address : 'Aucune'}
            </p>
          </Card>
        </div>

        {/* Test Controls */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Tests de Géolocalisation</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Button onClick={() => testCityDetection()} variant="outline">
              <Smartphone className="h-4 w-4 mr-2" />
              Auto-Détection
            </Button>
            
            <Button onClick={testIPGeolocation} variant="outline">
              <Globe className="h-4 w-4 mr-2" />
              Test IP Geo
            </Button>
            
            <Button onClick={testAllCities} variant="outline">
              Test Toutes Villes
            </Button>
            
            <Button onClick={clearCache} variant="destructive">
              Vider Cache
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium mb-2">Tests par ville:</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TEST_COORDINATES).map(([cityCode, coords]) => (
                <Button
                  key={cityCode}
                  size="sm"
                  variant="secondary"
                  onClick={() => testCityDetection(coords)}
                  className="capitalize"
                >
                  {cityCode}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Location Picker Test */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Sélecteur de Position</h2>
          
          <UniversalLocationPicker
            value={selectedLocation}
            onChange={setSelectedLocation}
            placeholder="Rechercher une adresse..."
            label="Position de test"
          />
          
          {selectedLocation && (
            <div className="mt-4 p-4 bg-secondary/20 rounded-lg">
              <h3 className="font-medium mb-2">Position Sélectionnée:</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Adresse:</strong> {selectedLocation.address}</p>
                <p><strong>Coordonnées:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
                <p><strong>Type:</strong> <Badge variant="secondary">{selectedLocation.type}</Badge></p>
                {selectedLocation.accuracy && (
                  <p><strong>Précision:</strong> {selectedLocation.accuracy}m</p>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Test Results */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Résultats des Tests</h2>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun test lancé
              </p>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  className="text-sm font-mono p-2 bg-secondary/20 rounded"
                >
                  {result}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Cities Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Villes Supportées</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(SUPPORTED_CITIES).map((city) => (
              <div key={city.code} className="p-3 border rounded-lg">
                <h3 className="font-medium">{city.name}</h3>
                <p className="text-sm text-muted-foreground">{city.countryCode}</p>
                <p className="text-xs text-muted-foreground">
                  {city.coordinates.lat.toFixed(4)}, {city.coordinates.lng.toFixed(4)}
                </p>
                <Badge variant="outline" className="mt-1">
                  {city.currency}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}