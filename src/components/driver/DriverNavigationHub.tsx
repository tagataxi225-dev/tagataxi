/**
 * 🧭 PHASE 6: Driver Navigation Hub
 * Interface de navigation turn-by-turn moderne EMBEDDED dans la carte
 * Instructions vocales + recalcul automatique + zoom dynamique
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Phone, 
  CheckCircle, 
  Navigation, 
  Volume2, 
  VolumeX,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { navigationService } from '@/services/navigationService';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { useDriverGeolocation } from '@/hooks/useDriverGeolocation';
import { driverHaptics } from '@/utils/driverHaptics';
import { toast } from 'sonner';

interface DriverNavigationHubProps {
  orderId: string;
  orderType: 'taxi' | 'delivery' | 'marketplace';
  pickup: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  customerPhone?: string;
  onConfirmArrival: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

export const DriverNavigationHub: React.FC<DriverNavigationHubProps> = ({
  orderId,
  orderType,
  pickup,
  destination,
  customerPhone,
  onConfirmArrival,
  onComplete,
  onCancel
}) => {
  const { location } = useDriverGeolocation({ autoSync: true });
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentInstruction, setCurrentInstruction] = useState<string>('Démarrage de la navigation...');
  const [remainingDistance, setRemainingDistance] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [isAtPickup, setIsAtPickup] = useState(false);

  /**
   * Démarrer la navigation automatiquement
   */
  useEffect(() => {
    if (!navigationStarted && location) {
      startNavigation();
    }
  }, [location, navigationStarted]);

  const startNavigation = async () => {
    if (!location) {
      toast.error('Position GPS non disponible');
      return;
    }

    try {
      const calculatedRoute = await navigationService.startNavigation(
        { lat: location.latitude, lng: location.longitude },
        isAtPickup ? destination : pickup,
        {
          voiceEnabled,
          onInstructionChange: (instruction) => {
            setCurrentInstruction(instruction);
            driverHaptics.onTurnByTurn();
          },
          onLocationUpdate: () => {
            updateNavigationStats();
          },
          onOffRoute: () => {
            toast.warning('Hors de l\'itinéraire', {
              description: 'Recalcul...'
            });
          },
          onRouteRecalculated: () => {
            toast.success('Itinéraire recalculé');
          }
        }
      );

      if (calculatedRoute) {
        setNavigationStarted(true);
        setRemainingDistance(calculatedRoute.distance / 1000);
        setEta(Math.ceil(calculatedRoute.duration / 60));
        toast.success('Navigation démarrée');
      }
    } catch (error) {
      console.error('Erreur navigation:', error);
      toast.error('Impossible de démarrer');
    }
  };

  const updateNavigationStats = () => {
    const distance = navigationService.getRemainingDistance() / 1000;
    const duration = navigationService.getRemainingDuration() / 60;
    
    setRemainingDistance(distance);
    setEta(Math.ceil(duration));

    if (distance < 0.1 && !isAtPickup) {
      setIsAtPickup(true);
      toast.success('Arrivée au point de départ !');
      driverHaptics.onRideAccepted();
    }
  };

  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    navigationService.setVoiceEnabled(newState);
    toast.success(newState ? '🔊 Voix activée' : '🔇 Voix désactivée');
  };

  const handleCallClient = () => {
    if (customerPhone) {
      window.location.href = `tel:${customerPhone}`;
      driverHaptics.onGPSStart();
    }
  };

  const handleConfirm = () => {
    driverHaptics.onRideAccepted();
    
    if (!isAtPickup) {
      setIsAtPickup(true);
      onConfirmArrival();
      setTimeout(() => startNavigation(), 1000);
    } else {
      navigationService.stopNavigation();
      onComplete();
    }
  };

  const handleCancel = () => {
    navigationService.stopNavigation();
    onCancel();
  };

  return (
    <div className="h-screen flex flex-col">
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "p-4 text-white shadow-lg",
          orderType === 'taxi' 
            ? "bg-gradient-to-r from-blue-600 to-purple-600" 
            : "bg-gradient-to-r from-green-600 to-emerald-600"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {isAtPickup ? 'Vers destination' : 'Vers client'}
          </Badge>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleVoice}
              className="text-white hover:bg-white/20"
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentInstruction}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-3"
          >
            <p className="text-2xl font-bold leading-tight">{currentInstruction}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-around text-sm">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            <span className="font-bold">{remainingDistance.toFixed(1)} km</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-bold">{eta} min</span>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-bold">En route</span>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 relative">
        <GoogleMapsKwenda
          center={location ? { lat: location.latitude, lng: location.longitude } : pickup}
          zoom={16}
          height="100%"
          driverLocation={location ? {
            lat: location.latitude,
            lng: location.longitude,
            heading: location.heading
          } : undefined}
          pickup={isAtPickup ? undefined : pickup}
          destination={isAtPickup ? destination : undefined}
          showRoute={true}
        />
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-background border-t p-4 space-y-2 shadow-2xl"
      >
        {customerPhone && (
          <Button 
            variant="outline"
            className="w-full h-14 text-base font-semibold" 
            onClick={handleCallClient}
          >
            <Phone className="h-5 w-5 mr-2 text-green-600" />
            Appeler le client
          </Button>
        )}
        
        <Button 
          className={cn(
            "w-full h-16 text-lg font-bold shadow-lg",
            isAtPickup 
              ? "bg-gradient-to-r from-orange-500 to-red-500"
              : "bg-gradient-to-r from-green-500 to-emerald-500"
          )}
          onClick={handleConfirm}
          disabled={remainingDistance > 0.5}
        >
          <CheckCircle className="h-6 w-6 mr-2" />
          {isAtPickup ? 'Confirmer livraison' : 'Confirmer arrivée'}
        </Button>
      </motion.div>
    </div>
  );
};
