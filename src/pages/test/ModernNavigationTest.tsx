/**
 * 🧭 PAGE TEST NAVIGATION MODERNE
 * 
 * Page de test pour l'interface de navigation moderne
 * avec destinations prédéfinies pour Kinshasa
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Navigation, MapPin, Clock, ArrowRight } from 'lucide-react';
import { ModernNavigationUI } from '@/components/navigation/ModernNavigationUI';

interface TestDestination {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: 'business' | 'residential' | 'landmark' | 'airport';
  estimatedTime: string;
}

const TEST_DESTINATIONS: TestDestination[] = [
  {
    id: '1',
    name: 'Aéroport de N\'djili',
    address: 'Aéroport International de Kinshasa, N\'djili',
    lat: -4.3858,
    lng: 15.4246,
    category: 'airport',
    estimatedTime: '45 min'
  },
  {
    id: '2', 
    name: 'Centre-ville Gombe',
    address: 'Boulevard du 30 Juin, Gombe, Kinshasa',
    lat: -4.3098,
    lng: 15.3129,
    category: 'business',
    estimatedTime: '25 min'
  },
  {
    id: '3',
    name: 'Marché Central',
    address: 'Grand Marché Central, Kinshasa',
    lat: -4.3276,
    lng: 15.3014,
    category: 'landmark',
    estimatedTime: '20 min'
  },
  {
    id: '4',
    name: 'Université de Kinshasa',
    address: 'Campus UNIKIN, Mont-Amba, Kinshasa',
    lat: -4.4175,
    lng: 15.3047,
    category: 'landmark',
    estimatedTime: '35 min'
  },
  {
    id: '5',
    name: 'Quartier Matonge',
    address: 'Avenue Kalemie, Kalamu, Kinshasa',
    lat: -4.3420,
    lng: 15.3180,
    category: 'residential',
    estimatedTime: '15 min'
  }
];

export const ModernNavigationTest: React.FC = () => {
  const [selectedDestination, setSelectedDestination] = useState<TestDestination | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);

  // ==================== GESTIONNAIRES ====================

  const handleSelectDestination = (destination: TestDestination) => {
    setSelectedDestination(destination);
    setShowNavigation(true);
  };

  const handleCloseNavigation = () => {
    setShowNavigation(false);
    setSelectedDestination(null);
  };

  const getCategoryIcon = (category: TestDestination['category']) => {
    switch (category) {
      case 'airport': return '✈️';
      case 'business': return '🏢';
      case 'landmark': return '🏛️';
      case 'residential': return '🏠';
      default: return '📍';
    }
  };

  const getCategoryColor = (category: TestDestination['category']) => {
    switch (category) {
      case 'airport': return 'bg-blue-100 text-blue-800';
      case 'business': return 'bg-green-100 text-green-800';
      case 'landmark': return 'bg-purple-100 text-purple-800';
      case 'residential': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ==================== RENDU ====================

  if (showNavigation && selectedDestination) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <ModernNavigationUI
            destination={{
              lat: selectedDestination.lat,
              lng: selectedDestination.lng,
              address: selectedDestination.address
            }}
            onClose={handleCloseNavigation}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Navigation Moderne</h1>
              <p className="text-primary-foreground/80">
                Test du système de navigation IA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* Instructions */}
          <Card className="p-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold">Sélectionnez une destination</h2>
                <p className="text-muted-foreground">
                  Choisissez un lieu à Kinshasa pour tester la navigation moderne
                </p>
              </div>
            </div>
          </Card>

          {/* Liste des destinations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              Destinations disponibles
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {TEST_DESTINATIONS.map((destination) => (
                <Card 
                  key={destination.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSelectDestination(destination)}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getCategoryIcon(destination.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {destination.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {destination.address}
                          </p>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <Separator />

                    {/* Infos */}
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="secondary"
                        className={getCategoryColor(destination.category)}
                      >
                        {destination.category}
                      </Badge>
                      
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{destination.estimatedTime}</span>
                      </div>
                    </div>

                    {/* Coordonnées (pour debug) */}
                    <div className="text-xs text-muted-foreground/60">
                      {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Informations techniques */}
          <Card className="p-6 bg-muted/30">
            <h3 className="text-lg font-semibold mb-4">Fonctionnalités testées</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">🧠 Intelligence Artificielle</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Optimisation itinéraires temps réel</li>
                  <li>• Prédiction trafic Kinshasa</li>
                  <li>• Recalcul automatique intelligent</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">🗣️ Navigation Vocale</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Instructions en français</li>
                  <li>• Synthèse vocale naturelle</li>
                  <li>• Contrôles audio intuitifs</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">📱 Interface Moderne</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Design identique capture d'écran</li>
                  <li>• Animations fluides 60fps</li>
                  <li>• Responsive mobile-first</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">⚡ Performance</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tracking GPS optimisé</li>
                  <li>• Cache intelligent</li>
                  <li>• Mode offline dégradé</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};