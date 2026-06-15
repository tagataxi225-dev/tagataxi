/**
 * Interface de conduite adaptée pour utilisation mobile
 * Grands boutons, voix, et navigation sécurisée
 */

import React, { useState, useEffect, useRef } from 'react';
import { FloatingSOS } from '@/components/emergency/FloatingSOS';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Navigation, 
  Phone, 
  VolumeX, 
  Volume2, 
  Play, 
  Pause,
  MapPin,
  Clock,
  Battery,
  Signal,
  AlertTriangle
} from 'lucide-react';
import { useBatteryOptimizedTracking } from '@/hooks/useBatteryOptimizedTracking';
import { useToast } from '@/hooks/use-toast';

interface DrivingInterfaceProps {
  currentTrip?: {
    id: string;
    pickup: { address: string; lat: number; lng: number };
    destination: { address: string; lat: number; lng: number };
    passengerName: string;
    passengerPhone: string;
    estimatedDuration: number;
    estimatedDistance: number;
  };
  onTripUpdate?: (status: string) => void;
  onEmergency?: () => void;
}

export default function DrivingInterface({
  currentTrip,
  onTripUpdate,
  onEmergency
}: DrivingInterfaceProps) {
  const [tripStatus, setTripStatus] = useState<'en_route' | 'arrived' | 'in_progress' | 'completed'>('en_route');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [tripProgress, setTripProgress] = useState(0);
  const [isNightMode, setIsNightMode] = useState(false);
  
  const { toast } = useToast();
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isTracking,
    currentLocation,
    batteryLevel,
    stats,
    networkStatus,
    offlineQueueSize,
    startTracking,
    stopTracking
  } = useBatteryOptimizedTracking({
    enableBackgroundMode: true,
    accuracyLevel: 'balanced',
    updateIntervalMs: 10000,
    distanceFilterMeters: 20,
    enableBatteryOptimization: true,
    showNotification: true
  });

  useEffect(() => {
    if (currentTrip) {
      startTracking();
      startTimer();
    }

    // Détection automatique du mode nuit
    const hour = new Date().getHours();
    setIsNightMode(hour < 6 || hour > 20);

    return () => {
      stopTracking();
      stopTimer();
    };
  }, [currentTrip]);

  useEffect(() => {
    // Calculer le progrès du trajet
    if (currentLocation && currentTrip) {
      const totalDistance = currentTrip.estimatedDistance;
      const remainingDistance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        currentTrip.destination.lat,
        currentTrip.destination.lng
      );
      
      const progress = Math.max(0, Math.min(100, ((totalDistance - remainingDistance) / totalDistance) * 100));
      setTripProgress(progress);

      // Détecter arrivée
      if (remainingDistance < 100 && tripStatus === 'en_route') {
        handleArrival();
      }
    }
  }, [currentLocation, currentTrip, tripStatus]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const speak = (text: string) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;

    // Arrêter le speech précédent
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleArrival = () => {
    setTripStatus('arrived');
    speak('Vous êtes arrivé à destination. Contactez le passager.');
    onTripUpdate?.('arrived');
    
    toast({
      title: "Arrivée à destination",
      description: "Contactez le passager pour confirmer votre présence",
      duration: 5000
    });
  };

  const handleStartTrip = () => {
    setTripStatus('in_progress');
    speak('Trajet commencé. Bonne route !');
    onTripUpdate?.('in_progress');
    
    toast({
      title: "Trajet commencé",
      description: "Le passager a été notifié",
      duration: 3000
    });
  };

  const handleCompleteTrip = () => {
    setTripStatus('completed');
    speak('Trajet terminé. Merci pour votre service.');
    onTripUpdate?.('completed');
    stopTracking();
    stopTimer();
    
    toast({
      title: "Trajet terminé",
      description: "Évaluation du passager en attente",
      duration: 3000
    });
  };

  const callPassenger = () => {
    if (currentTrip?.passengerPhone) {
      // Vibration pour retour haptique
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      window.open(`tel:${currentTrip.passengerPhone}`);
    }
  };

  const openNavigation = () => {
    if (currentTrip) {
      const destination = tripStatus === 'en_route' ? currentTrip.pickup : currentTrip.destination;
      const url = `geo:${destination.lat},${destination.lng}?q=${destination.lat},${destination.lng}(${destination.address})`;
      window.open(url, '_system');
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusInfo = () => {
    switch (tripStatus) {
      case 'en_route':
        return {
          title: 'En route vers le passager',
          color: 'bg-blue-500',
          icon: Navigation,
          action: 'Récupération'
        };
      case 'arrived':
        return {
          title: 'Arrivé à la prise en charge',
          color: 'bg-orange-500',
          icon: MapPin,
          action: 'Attente'
        };
      case 'in_progress':
        return {
          title: 'Trajet en cours',
          color: 'bg-green-500',
          icon: Navigation,
          action: 'Destination'
        };
      case 'completed':
        return {
          title: 'Trajet terminé',
          color: 'bg-gray-500',
          icon: MapPin,
          action: 'Terminé'
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (!currentTrip) {
    return (
      <div className="h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <Navigation className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">En attente</h1>
          <p className="text-muted-foreground">Aucun trajet en cours</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${isNightMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
      <FloatingSOS tripId={currentTrip.id} />
      {/* Barre de statut */}
      <div className={`flex items-center justify-between p-4 ${isNightMode ? 'bg-gray-900' : 'bg-white border-b'}`}>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${statusInfo.color}`}></div>
          <Badge variant="secondary" className={isNightMode ? "text-white bg-gray-700" : "text-gray-900 bg-gray-200"}>
            {statusInfo.action}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Battery className="h-4 w-4" />
            <span>{batteryLevel}%</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Signal className="h-4 w-4" />
            <span>{isTracking ? 'GPS' : 'Off'}</span>
            {networkStatus === 'offline' && (
              <span className="text-red-400 text-xs">({offlineQueueSize} en attente)</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      {/* Informations principales */}
      <div className="flex-1 p-6 space-y-6">
        {/* Statut du trajet */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <statusInfo.icon className="h-8 w-8 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">{statusInfo.title}</h2>
              <p className="text-gray-400">Trajet #{currentTrip.id.slice(0, 8)}</p>
            </div>
          </div>
          
          <Progress value={tripProgress} className="h-2 mb-2" />
          <p className="text-sm text-gray-400">{Math.round(tripProgress)}% complété</p>
        </Card>

        {/* Informations passager */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Passager</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Nom</p>
              <p className="text-white font-medium">{currentTrip.passengerName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Distance</p>
                <p className="text-white font-medium">{(currentTrip.estimatedDistance / 1000).toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Durée prévue</p>
                <p className="text-white font-medium">{Math.round(currentTrip.estimatedDuration)} min</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Destination */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            {tripStatus === 'en_route' ? 'Prise en charge' : 'Destination'}
          </h3>
          <p className="text-white font-medium">
            {tripStatus === 'en_route' ? currentTrip.pickup.address : currentTrip.destination.address}
          </p>
        </Card>
      </div>

      {/* Contrôles principaux */}
      <div className="p-6 bg-gray-900 space-y-4">
        {/* Boutons de navigation et communication */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            onClick={openNavigation}
            className="h-16 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Navigation className="h-6 w-6 mr-2" />
            Navigation
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={callPassenger}
            className="h-16 border-gray-600 text-white hover:bg-gray-800"
          >
            <Phone className="h-6 w-6 mr-2" />
            Appeler
          </Button>
        </div>

        {/* Contrôles audio */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className="text-gray-400 hover:text-white"
          >
            {isVoiceEnabled ? (
              <Volume2 className="h-5 w-5 mr-2" />
            ) : (
              <VolumeX className="h-5 w-5 mr-2" />
            )}
            {isVoiceEnabled ? 'Audio activé' : 'Audio coupé'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onEmergency}
            className="text-red-400 hover:text-red-300"
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            Urgence
          </Button>
        </div>

        {/* Action principale selon le statut */}
        {tripStatus === 'arrived' && (
          <Button
            size="lg"
            onClick={handleStartTrip}
            className="w-full h-16 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
          >
            <Play className="h-6 w-6 mr-2" />
            Commencer le trajet
          </Button>
        )}

        {tripStatus === 'in_progress' && (
          <Button
            size="lg"
            onClick={handleCompleteTrip}
            className="w-full h-16 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
          >
            <Pause className="h-6 w-6 mr-2" />
            Terminer le trajet
          </Button>
        )}
      </div>
    </div>
  );
}

// Fonction utilitaire pour calculer la distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}