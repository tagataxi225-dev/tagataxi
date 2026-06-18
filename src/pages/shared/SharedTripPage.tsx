/**
 * Page de partage de trajet accessible publiquement
 * Affiche les informations du trajet partagé en temps réel
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  Car, 
  ExternalLink,
  Share2,
  Shield
} from 'lucide-react';
import { tripSharingService, TripShareData } from '@/services/tripSharingService';

export default function SharedTripPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tripData, setTripData] = useState<TripShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!shareId) {
      setError('ID de partage manquant');
      setLoading(false);
      return;
    }

    loadTripData();
    
    // Actualisation toutes les 30 secondes
    const interval = setInterval(loadTripData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [shareId]);

  const loadTripData = async () => {
    try {
      if (!shareId) return;
      
      const data = await tripSharingService.getTripShareData(shareId);
      
      if (!data) {
        setError('Lien de partage invalide ou expiré');
        setLoading(false);
        return;
      }

      setTripData(data);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les données du trajet');
      console.error('Erreur chargement données trajet:', err);
    } finally {
      setLoading(false);
    }
  };

  const openInGoogleMaps = () => {
    if (!tripData) return;

    const baseUrl = 'https://www.google.com/maps/dir/';
    const origin = encodeURIComponent(tripData.pickupAddress);
    const destination = encodeURIComponent(tripData.destinationAddress);
    
    let url = `${baseUrl}${origin}/${destination}`;
    
    if (tripData.currentLocation) {
      const current = `${tripData.currentLocation.lat},${tripData.currentLocation.lng}`;
      url = `${baseUrl}${origin}/${current}/${destination}`;
    }

    window.open(url + '?travelmode=driving&hl=fr', '_blank');
  };

  const shareTrip = () => {
    if (navigator.share) {
      navigator.share({
        title: `Trajet de ${tripData?.passengerName}`,
        text: `Suivez mon trajet en temps réel`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié",
        description: "Le lien de partage a été copié dans le presse-papiers"
      });
    }
  };

  const callDriver = () => {
    if (tripData?.driverPhone) {
      window.open(`tel:${tripData.driverPhone}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Chargement du trajet...</p>
        </Card>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Trajet non accessible</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* En-tête */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Trajet partagé</h1>
              <p className="text-muted-foreground">Suivi en temps réel</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={shareTrip}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">En direct</span>
            </div>
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Arrivée {tripData.estimatedArrival}
            </Badge>
          </div>
        </Card>

        {/* Informations du trajet */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Itinéraire</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="h-3 w-3 bg-blue-500 rounded-full mt-1"></div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">DÉPART</p>
                <p className="font-medium">{tripData.pickupAddress}</p>
              </div>
            </div>
            
            {tripData.currentLocation && (
              <div className="flex items-start space-x-3">
                <div className="h-3 w-3 bg-orange-500 rounded-full mt-1 animate-pulse"></div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">POSITION ACTUELLE</p>
                  <p className="font-medium">
                    {tripData.currentLocation.lat.toFixed(4)}, {tripData.currentLocation.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <div className="h-3 w-3 bg-green-500 rounded-full mt-1"></div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">DESTINATION</p>
                <p className="font-medium">{tripData.destinationAddress}</p>
              </div>
            </div>
          </div>
          
          <Button
            className="w-full mt-4"
            onClick={openInGoogleMaps}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Ouvrir dans Google Maps
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Card>

        {/* Informations chauffeur et véhicule */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Chauffeur & Véhicule</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-sm text-muted-foreground mb-1">CHAUFFEUR</p>
              <p className="font-medium">{tripData.driverName}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={callDriver}
              >
                <Phone className="h-4 w-4 mr-2" />
                Appeler
              </Button>
            </div>
            
            <div>
              <p className="font-medium text-sm text-muted-foreground mb-1">VÉHICULE</p>
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{tripData.vehicleInfo}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Informations passager */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Passager</h2>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="font-medium text-primary">
                {tripData.passengerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{tripData.passengerName}</p>
              <p className="text-sm text-muted-foreground">Partage son trajet avec vous</p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Propulsé par TAGA</p>
          <p>Plateforme de transport sécurisée</p>
        </div>
      </div>
    </div>
  );
}