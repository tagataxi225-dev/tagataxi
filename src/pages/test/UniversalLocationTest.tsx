/**
 * 🌍 PAGE DE TEST GÉOLOCALISATION UNIVERSELLE
 */

import React, { useState } from 'react';
import { UniversalLocationPicker } from '@/components/location/UniversalLocationPicker';
import { LocationData } from '@/hooks/useSmartGeolocation';
import { universalGeolocation, SUPPORTED_CITIES } from '@/services/universalGeolocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UniversalLocationTest() {
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [delivery, setDelivery] = useState<LocationData | null>(null);
  const [currentCity, setCurrentCity] = useState<string>('Détection en cours...');

  // Détecter la ville actuelle
  const detectCurrentCity = async () => {
    try {
      const city = await universalGeolocation.detectUserCity();
      setCurrentCity(`${city.name} (${city.countryCode})`);
    } catch (error) {
      setCurrentCity('Erreur détection');
    }
  };

  // Changer manuellement de ville
  const changeCity = (cityCode: string) => {
    const city = universalGeolocation.setCity(cityCode);
    setCurrentCity(`${city.name} (${city.countryCode}) - Manuel`);
  };

  React.useEffect(() => {
    detectCurrentCity();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">
          🌍 Test Géolocalisation Universelle
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Testez la détection automatique de ville et la recherche contextuelle
        </p>
        
        {/* Indicateur de ville actuelle */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📍 Ville Détectée</span>
              <Button onClick={detectCurrentCity} variant="outline" size="sm">
                Redétecter
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">{currentCity}</span>
              <Badge variant="secondary">
                Auto-détection
              </Badge>
            </div>
            
            {/* Boutons pour changer manuellement de ville */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(SUPPORTED_CITIES).map(([key, city]) => (
                <Button
                  key={key}
                  onClick={() => changeCity(key)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {city.name}
                  <br />
                  <span className="text-muted-foreground">
                    {city.countryCode}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Pickup */}
        <Card>
          <CardHeader>
            <CardTitle>🏁 Localisation de Départ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UniversalLocationPicker
              value={pickup}
              onChange={setPickup}
              placeholder="Où partez-vous ?"
              label="Point de départ"
              showAccuracy={true}
            />
            
            {pickup && (
              <div className="bg-secondary/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">📍 Localisation sélectionnée:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Nom:</strong> {pickup.name}</p>
                  <p><strong>Adresse:</strong> {pickup.address}</p>
                  <p><strong>Coordonnées:</strong> {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}</p>
                  <p><strong>Type:</strong> {pickup.type}</p>
                  {pickup.accuracy && (
                    <p><strong>Précision:</strong> ±{Math.round(pickup.accuracy)}m</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Delivery */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Localisation d'Arrivée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UniversalLocationPicker
              value={delivery}
              onChange={setDelivery}
              placeholder="Où allez-vous ?"
              label="Point d'arrivée"
              showAccuracy={true}
            />
            
            {delivery && (
              <div className="bg-secondary/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">📍 Localisation sélectionnée:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Nom:</strong> {delivery.name}</p>
                  <p><strong>Adresse:</strong> {delivery.address}</p>
                  <p><strong>Coordonnées:</strong> {delivery.lat.toFixed(4)}, {delivery.lng.toFixed(4)}</p>
                  <p><strong>Type:</strong> {delivery.type}</p>
                  {delivery.accuracy && (
                    <p><strong>Précision:</strong> ±{Math.round(delivery.accuracy)}m</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Résumé des localisations */}
      {(pickup || delivery) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📋 Résumé des Localisations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">🏁 Départ</h4>
                {pickup ? (
                  <div className="text-sm">
                    <p>{pickup.name || pickup.address}</p>
                    <p className="text-muted-foreground">
                      {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Aucune localisation sélectionnée</p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-blue-600 mb-2">🎯 Arrivée</h4>
                {delivery ? (
                  <div className="text-sm">
                    <p>{delivery.name || delivery.address}</p>
                    <p className="text-muted-foreground">
                      {delivery.lat.toFixed(4)}, {delivery.lng.toFixed(4)}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Aucune localisation sélectionnée</p>
                )}
              </div>
            </div>
            
            {pickup && delivery && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <h4 className="font-medium text-primary mb-2">📏 Distance Estimée</h4>
                <p className="text-sm">
                  Calculez la distance entre les deux points avec votre service de routage préféré.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>💡 Instructions de Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <span>1️⃣</span>
              <span>La ville est détectée automatiquement selon votre localisation</span>
            </div>
            <div className="flex items-start space-x-2">
              <span>2️⃣</span>
              <span>Les recherches sont contextuelles à la ville détectée</span>
            </div>
            <div className="flex items-start space-x-2">
              <span>3️⃣</span>
              <span>Testez manuellement d'autres villes avec les boutons ci-dessus</span>
            </div>
            <div className="flex items-start space-x-2">
              <span>4️⃣</span>
              <span>Utilisez le bouton de géolocalisation pour votre position actuelle</span>
            </div>
            <div className="flex items-start space-x-2">
              <span>5️⃣</span>
              <span>Les lieux populaires changent selon la ville active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}