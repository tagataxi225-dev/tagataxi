/**
 * 🧭 INTERFACE NAVIGATION MODERNE
 * 
 * Interface identique à la capture d'écran avec:
 * - Barre verte avec destination et flèche
 * - Instructions "Puis" avec manœuvres
 * - Contrôles circulaires (son, vitesse, centrage)
 * - Timer, distance et ETA temps réel
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Volume2, 
  VolumeX, 
  Navigation,
  MapPin, 
  Clock,
  Zap,
  RotateCcw,
  ChevronRight,
  Activity,
  Gauge
} from 'lucide-react';
import { useModernNavigation } from '@/hooks/useModernNavigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernNavigationUIProps {
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  onClose?: () => void;
  className?: string;
}

export const ModernNavigationUI: React.FC<ModernNavigationUIProps> = ({
  destination,
  onClose,
  className
}) => {
  const {
    navigationState,
    isActive,
    currentInstruction,
    nextInstruction,
    progress,
    remainingDistance,
    remainingDuration,
    eta,
    currentSpeed,
    isOffRoute,
    isRecalculating,
    startNavigation,
    stopNavigation,
    recalculateRoute,
    toggleVoice,
    isVoiceEnabled,
    formatRemainingDistance,
    formatRemainingTime,
    getSpeedStatus,
    getNavigationHealth
  } = useModernNavigation();

  const [isMinimized, setIsMinimized] = useState(false);

  // ==================== GESTIONNAIRES ====================

  const handleStartNavigation = async () => {
    await startNavigation(destination, {
      optimizeFor: 'time',
      vehicleType: 'car',
      enableVoice: isVoiceEnabled
    });
  };

  const handleStopNavigation = async () => {
    await stopNavigation();
    onClose?.();
  };

  // ==================== HELPERS ====================

  const getInstructionIcon = (type: string): string => {
    switch (type) {
      case 'turn-left': return '←';
      case 'turn-right': return '→';
      case 'straight': return '↑';
      case 'uturn': return '↺';
      case 'arrive': return '🏁';
      case 'roundabout': return '⟲';
      default: return '↑';
    }
  };

  const getStatusColor = (): string => {
    const health = getNavigationHealth();
    switch (health) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSpeedColor = (): string => {
    const status = getSpeedStatus();
    switch (status) {
      case 'slow': return 'text-yellow-500';
      case 'fast': return 'text-red-500';
      default: return 'text-green-500';
    }
  };

  // ==================== RENDU ====================

  if (!isActive) {
    return (
      <Card className={cn("p-6 bg-background/95 backdrop-blur-sm border-border/50", className)}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Navigation className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Navigation vers</h3>
            <p className="text-sm text-muted-foreground">{destination.address}</p>
          </div>

          <Button 
            onClick={handleStartNavigation}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Démarrer la navigation
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative", className)}
    >
      {/* BARRE VERTE PRINCIPALE */}
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Header vert avec destination */}
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {destination.address}
                </p>
                <p className="text-xs text-green-100">
                  {formatRemainingDistance()} • {formatRemainingTime()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {eta}
              </Badge>
              
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-3">
            <Progress 
              value={progress} 
              className="h-1 bg-green-500"
            />
          </div>
        </div>

        {/* INSTRUCTIONS NAVIGATION */}
        <div className="p-4 bg-background">
          <AnimatePresence mode="wait">
            {currentInstruction && (
              <motion.div
                key={currentInstruction.text}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {/* Instruction principale */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {getInstructionIcon(currentInstruction.type)}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {currentInstruction.text}
                    </p>
                    {currentInstruction.street && (
                      <p className="text-sm text-muted-foreground">
                        sur {currentInstruction.street}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {formatRemainingDistance()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      dans {Math.round(currentInstruction.distance)}m
                    </p>
                  </div>
                </div>

                {/* Instruction suivante */}
                {nextInstruction && (
                  <div className="flex items-center space-x-4 opacity-60">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm">
                      {getInstructionIcon(nextInstruction.type)}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Puis {nextInstruction.text}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ALERTES */}
          <AnimatePresence>
            {isOffRoute && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center space-x-2 text-yellow-800">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Vous avez quitté l'itinéraire
                  </span>
                </div>
              </motion.div>
            )}

            {isRecalculating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center space-x-2 text-blue-800">
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">
                    Recalcul de l'itinéraire...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CONTRÔLES CIRCULAIRES */}
        <div className="p-4 bg-muted/30 border-t">
          <div className="flex items-center justify-between">
            {/* Vitesse */}
            <div className="text-center">
              <div className={cn(
                "w-12 h-12 rounded-full border-2 flex items-center justify-center",
                getSpeedColor(),
                "border-current"
              )}>
                <Gauge className="w-5 h-5" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(currentSpeed * 3.6)} km/h
              </p>
            </div>

            {/* Contrôles audio */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVoice}
                className={cn(
                  "w-12 h-12 rounded-full",
                  isVoiceEnabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                )}
              >
                {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                {isVoiceEnabled ? 'Audio' : 'Muet'}
              </p>
            </div>

            {/* Recalcul */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={recalculateRoute}
                disabled={isRecalculating}
                className="w-12 h-12 rounded-full bg-blue-100 text-blue-600"
              >
                <RotateCcw className={cn("w-5 h-5", isRecalculating && "animate-spin")} />
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Route
              </p>
            </div>

            {/* Timer/Horloge */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>

          {/* Bouton arrêt */}
          <div className="mt-4 flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsMinimized(!isMinimized)}
              className="flex-1"
            >
              {isMinimized ? 'Développer' : 'Réduire'}
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleStopNavigation}
              className="px-6"
            >
              Arrêter
            </Button>
          </div>
        </div>

        {/* Indicateur de statut */}
        <div className={cn(
          "absolute top-2 right-2 w-3 h-3 rounded-full",
          getStatusColor()
        )} />
      </Card>
    </motion.div>
  );
};