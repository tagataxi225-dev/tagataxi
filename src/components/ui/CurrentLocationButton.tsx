/**
 * 🎯 BOUTON DE GÉOLOCALISATION MODERNE ET PROFESSIONNEL
 * 
 * Composant unifié pour tous les services (taxi, livraison, etc.)
 * Design moderne avec animations fluides et feedback instantané
 */

import React, { useState } from 'react';
import { Navigation2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSmartGeolocation, type LocationData } from '@/hooks/useSmartGeolocation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface CurrentLocationButtonProps {
  onLocationSelect?: (location: LocationData) => void;
  context?: 'pickup' | 'delivery' | 'taxi-start' | 'taxi-destination' | 'general';
  variant?: 'default' | 'compact' | 'mini' | 'icon-only';
  className?: string;
  disabled?: boolean;
  showAccuracy?: boolean;
  autoTrigger?: boolean;
}

const contextLabels = {
  'pickup': 'Me géolocaliser',
  'delivery': 'Livrer ici', 
  'taxi-start': 'Départ ici',
  'taxi-destination': 'Destination ici',
  'general': 'Position actuelle'
};

const contextTooltips = {
  'pickup': 'Utiliser ma position actuelle comme point de collecte',
  'delivery': 'Utiliser ma position actuelle comme adresse de livraison',
  'taxi-start': 'Utiliser ma position actuelle comme point de départ',
  'taxi-destination': 'Utiliser ma position actuelle comme destination',
  'general': 'Obtenir ma position actuelle'
};

export const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  onLocationSelect,
  context = 'general',
  variant = 'default',
  className,
  disabled = false,
  showAccuracy = true,
  autoTrigger = false
}) => {
  const { getCurrentPosition, loading, error, currentLocation } = useSmartGeolocation();
  const [localState, setLocalState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);

  // Auto-trigger si demandé
  React.useEffect(() => {
    if (autoTrigger && !currentLocation && !loading) {
      handleGetLocation();
    }
  }, [autoTrigger, currentLocation, loading]);

  const handleGetLocation = async () => {
    if (disabled || loading) return;

    setLocalState('loading');
    
    try {
      // Options optimisées pour précision maximale
      const location = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000, // Plus de temps pour l'Afrique
        maximumAge: 30000, // Position plus récente
        fallbackToIP: true,
        fallbackToDatabase: false // Éviter les positions imprécises de la DB
      });
      
      // Valider la précision avant d'accepter
      if (location.accuracy && location.accuracy > 500) {
        console.warn('Position peu précise:', location.accuracy, 'm');
        // Retry une fois avec des paramètres plus stricts
        try {
          const retryLocation = await getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0 // Force une nouvelle position
          });
          if (retryLocation.accuracy && retryLocation.accuracy < location.accuracy) {
            setLastAccuracy(retryLocation.accuracy || null);
            setLocalState('success');
            onLocationSelect?.(retryLocation);
            setTimeout(() => setLocalState('idle'), 2500);
            return;
          }
        } catch {
          // Continue avec la position originale si retry échoue
        }
      }
      
      setLastAccuracy(location.accuracy || null);
      setLocalState('success');
      
      // Callback avec la position
      onLocationSelect?.(location);
      
      // Reset state après 2.5 secondes
      setTimeout(() => setLocalState('idle'), 2500);
      
    } catch (err) {
      console.error('Erreur géolocalisation:', err);
      setLocalState('error');
      
      // Reset error après 3 secondes
      setTimeout(() => setLocalState('idle'), 3000);
    }
  };

  const getIcon = () => {
    switch (localState) {
      case 'loading':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Navigation2 className="h-5 w-5 text-primary" />
          </motion.div>
        );
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Navigation2 className="h-5 w-5 text-primary" />;
    }
  };

  const getPrecisionBadge = () => {
    if (!lastAccuracy || localState !== 'success') return null;
    
    const accuracy = Math.round(lastAccuracy);
    let color = 'text-green-500';
    let label = 'Excellent';
    
    if (accuracy > 200) {
      color = 'text-destructive';
      label = 'Faible';
    } else if (accuracy > 50) {
      color = 'text-yellow-500';
      label = 'Bon';
    }
    
    return (
      <span className={`text-xs ${color} font-medium`}>
        ±{accuracy}m ({label})
      </span>
    );
  };

  const getButtonContent = () => {
    if (variant === 'icon-only' || variant === 'mini') {
      return getIcon();
    }

    if (variant === 'compact') {
      return (
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium">
            {localState === 'loading' ? 'Localisation...' : 
             localState === 'success' ? 'Trouvé !' :
             localState === 'error' ? 'Erreur' :
             'GPS'}
          </span>
        </div>
      );
    }

    // Variant default
    return (
      <div className="flex items-center gap-2">
        {getIcon()}
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">
            {localState === 'loading' ? 'Géolocalisation...' : 
             localState === 'success' ? 'Position trouvée !' :
             localState === 'error' ? 'Erreur de localisation' :
             contextLabels[context]}
          </span>
          {showAccuracy && lastAccuracy && localState === 'success' && (
            <span className="text-xs text-foreground/60">
              Précision ±{Math.round(lastAccuracy)}m
            </span>
          )}
        </div>
      </div>
    );
  };

  const getButtonVariant = () => {
    switch (localState) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getButtonSize = () => {
    switch (variant) {
      case 'mini':
        return 'sm';
      case 'icon-only':
        return 'icon';
      default:
        return 'default';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <Button
              onClick={handleGetLocation}
              disabled={disabled || loading}
              variant={getButtonVariant()}
              size={getButtonSize()}
              className={cn(
                'relative rounded-full transition-all duration-300 overflow-visible',
                // Bouton circulaire épuré
                'w-12 h-12 p-0',
                // Animation moderne en mode loading
                localState === 'loading' && 'shadow-lg shadow-primary/40',
                // Glow success moderne
                localState === 'success' && 'shadow-lg shadow-green-500/40 bg-green-50 text-green-600 border-green-300',
                // État erreur propre
                localState === 'error' && 'shadow-lg shadow-destructive/30 bg-destructive/10 text-destructive border-destructive/30',
                // État par défaut clean
                localState === 'idle' && 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-primary/20 hover:border-primary/50 shadow-md hover:shadow-lg hover:shadow-primary/30',
                className
              )}
            >
              {/* Anneau de pulsation amélioré pour loading */}
              <AnimatePresence>
                {localState === 'loading' && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ 
                      scale: [1, 1.5, 1.8],
                      opacity: [1, 0.6, 0]
                    }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                )}
              </AnimatePresence>
              
              {/* Icône centrale avec rotation fluide */}
              <motion.div
                key={localState}
                initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1, 
                  rotate: 0
                }}
                exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 20
                }}
                className="relative z-10 flex items-center justify-center"
              >
                {getIcon()}
              </motion.div>

              {/* Particules de succès ultra-minimalistes */}
              <AnimatePresence>
                {localState === 'success' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-green-500 rounded-full"
                        initial={{
                          x: "50%",
                          y: "50%",
                          scale: 0,
                          opacity: 1
                        }}
                        animate={{
                          x: `${50 + (Math.cos((i * 60) * Math.PI / 180) * 60)}%`,
                          y: `${50 + (Math.sin((i * 60) * Math.PI / 180) * 60)}%`,
                          scale: [0, 1.5, 0],
                          opacity: [1, 0.8, 0]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.8,
                          delay: i * 0.06,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{contextTooltips[context]}</p>
            
            {/* Indicateur de précision */}
            {getPrecisionBadge() && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/60">Précision:</span>
                {getPrecisionBadge()}
              </div>
            )}
            
            {/* Messages d'état */}
            {localState === 'loading' && (
              <p className="text-xs text-primary font-medium">
                🎯 Recherche de votre position...
              </p>
            )}
            
            {localState === 'success' && lastAccuracy && (
              <p className="text-xs text-green-600">
                ✅ Position trouvée avec succès
              </p>
            )}
            
            {error && (
              <div className="space-y-1">
                <p className="text-xs text-destructive font-medium">
                  ❌ {typeof error === 'string' ? error : 'Erreur de géolocalisation'}
                </p>
                <p className="text-xs text-foreground/60">
                  Vérifiez vos paramètres GPS et réessayez
                </p>
              </div>
            )}
            
            {currentLocation && localState === 'idle' && (
              <div className="space-y-1">
                <p className="text-xs text-foreground/60">Dernière position:</p>
                <p className="text-xs font-mono bg-muted/50 p-1 rounded text-foreground">
                  {currentLocation.address}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CurrentLocationButton;