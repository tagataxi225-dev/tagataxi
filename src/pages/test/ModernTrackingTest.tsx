import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Car, 
  Eye, 
  MapPin, 
  Clock, 
  Star,
  Phone,
  Navigation
} from 'lucide-react';
import { ModernTrackingModal } from '@/components/tracking/ModernTrackingModal';

export default function ModernTrackingTest() {
  const [selectedTracking, setSelectedTracking] = useState<{
    id: string;
    type: 'delivery' | 'taxi';
  } | null>(null);

  // Données de test
  const testDeliveries = [
    {
      id: 'del_test_001',
      type: 'delivery' as const,
      status: 'in_transit',
      driver: 'Jean-Claude Mukendi',
      pickup: 'Gombe, Avenue Lukonga',
      destination: 'Kintambo, Marché Central',
      price: 8500,
      progress: 65
    },
    {
      id: 'del_test_002',
      type: 'delivery' as const,
      status: 'picked_up',
      driver: 'Marie Kabongo',
      pickup: 'Bandalungwa, Avenue Mbombo',
      destination: 'Lemba, Université de Kinshasa',
      price: 12000,
      progress: 45
    }
  ];

  const testTaxis = [
    {
      id: 'taxi_test_001',
      type: 'taxi' as const,
      status: 'driver_assigned',
      driver: 'Patrick Mbuyi',
      pickup: 'Aéroport de N\'djili',
      destination: 'Hôtel Memling, Gombe',
      price: 25000,
      progress: 30
    },
    {
      id: 'taxi_test_002',
      type: 'taxi' as const,
      status: 'completed',
      driver: 'Joseph Tshilombo',
      pickup: 'Université de Kinshasa',
      destination: 'Centre-ville, Boulevard 30 Juin',
      price: 15000,
      progress: 100
    }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      driver_assigned: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-orange-100 text-orange-800',
      in_transit: 'bg-green-100 text-green-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string, type: 'delivery' | 'taxi') => {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      driver_assigned: 'Chauffeur assigné',
      picked_up: type === 'delivery' ? 'Colis récupéré' : 'Client récupéré',
      in_transit: type === 'delivery' ? 'En livraison' : 'En course',
      delivered: 'Livré',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const TrackingCard = ({ item }: { item: any }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTracking(item)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {item.type === 'delivery' ? (
              <Package className="w-5 h-5 text-blue-600" />
            ) : (
              <Car className="w-5 h-5 text-green-600" />
            )}
            <span className="font-semibold">#{item.id.slice(-6)}</span>
          </div>
          <Badge className={getStatusColor(item.status)}>
            {getStatusLabel(item.status, item.type)}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
            <span className="text-muted-foreground min-w-0 break-words">{item.pickup}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
            <span className="text-muted-foreground min-w-0 break-words">{item.destination}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold">{item.price.toLocaleString()} CDF</div>
          <div className="text-sm text-muted-foreground">{item.progress}%</div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Star className="w-3 h-3" />
          <span>{item.driver}</span>
        </div>

        <Button variant="outline" size="sm" className="w-full">
          <Eye className="w-4 h-4 mr-2" />
          Suivre en temps réel
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Interface de Suivi Moderne</h1>
          <p className="text-muted-foreground">
            Test du nouveau système de suivi unifié pour livraisons et courses taxi
          </p>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="deliveries" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deliveries" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Livraisons ({testDeliveries.length})
            </TabsTrigger>
            <TabsTrigger value="taxis" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Courses Taxi ({testTaxis.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deliveries" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testDeliveries.map((delivery) => (
                <TrackingCard key={delivery.id} item={delivery} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="taxis" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testTaxis.map((taxi) => (
                <TrackingCard key={taxi.id} item={taxi} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Fonctionnalités */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Fonctionnalités du Système Moderne</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Tracking Temps Réel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Localisation GPS en temps réel du chauffeur avec mise à jour toutes les 10 secondes.
                  Optimisation batterie intelligente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  ETA Dynamique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Calcul automatique du temps d'arrivée basé sur le trafic en temps réel et 
                  l'historique des performances.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-purple-600" />
                  Communication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Contact direct avec le chauffeur via appel téléphonique ou chat intégré.
                  Support client 24h/7j.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Guide d'utilisation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Guide d'Utilisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Sélection d'une commande</h4>
              <p className="text-sm text-muted-foreground">
                Cliquez sur une carte de livraison ou de course pour ouvrir l'interface de suivi moderne.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Suivi temps réel</h4>
              <p className="text-sm text-muted-foreground">
                L'interface se met à jour automatiquement avec la position du chauffeur et le statut de la commande.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Interaction</h4>
              <p className="text-sm text-muted-foreground">
                Utilisez les boutons pour contacter le chauffeur, afficher la carte ou contacter le support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de suivi */}
      {selectedTracking && (
        <ModernTrackingModal
          isOpen={true}
          onClose={() => setSelectedTracking(null)}
          trackingId={selectedTracking.id}
          trackingType={selectedTracking.type}
        />
      )}
    </div>
  );
}