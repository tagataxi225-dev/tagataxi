/**
 * 🎯 MARQUEUR DE POSITION FLUIDE
 * 
 * Affichage optimisé 60fps avec prédiction et interpolation
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { Car, Navigation, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FluidPositionMarkerProps {
  latitude: number;
  longitude: number;
  heading?: number;
  accuracy?: number;
  speed?: number;
  type?: 'driver' | 'client' | 'delivery';
  isActive?: boolean;
  isPredicted?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FluidPositionMarker: React.FC<FluidPositionMarkerProps> = ({
  latitude,
  longitude,
  heading = 0,
  accuracy = 20,
  speed = 0,
  type = 'client',
  isActive = true,
  isPredicted = false,
  className = "",
  size = 'md'
}) => {
  const [lastPosition, setLastPosition] = useState({ lat: latitude, lng: longitude });
  const [isMoving, setIsMoving] = useState(false);
  const animationRef = useRef<number>();
  
  // Valeurs animées pour interpolation fluide
  const animatedLat = useSpring(latitude, { stiffness: 300, damping: 30 });
  const animatedLng = useSpring(longitude, { stiffness: 300, damping: 30 });
  const animatedHeading = useSpring(heading, { stiffness: 200, damping: 25 });
  
  // Détection de mouvement
  useEffect(() => {
    const hasMovement = Math.abs(latitude - lastPosition.lat) > 0.00001 || 
                       Math.abs(longitude - lastPosition.lng) > 0.00001;
    
    if (hasMovement) {
      setIsMoving(true);
      setLastPosition({ lat: latitude, lng: longitude });
      
      // Arrêter l'animation après 2 secondes
      const timeout = setTimeout(() => setIsMoving(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [latitude, longitude, lastPosition]);

  // Animation de pulsation selon la vitesse
  const getPulseSpeed = () => {
    if (speed < 1) return 2; // Stationnaire
    if (speed < 5) return 1.5; // Marche
    if (speed < 15) return 1; // Véhicule urbain
    return 0.5; // Autoroute
  };

  const getMarkerSize = () => {
    switch (size) {
      case 'sm': return { marker: 'w-6 h-6', accuracy: 'w-4 h-4' };
      case 'lg': return { marker: 'w-12 h-12', accuracy: 'w-8 h-8' };
      default: return { marker: 'w-8 h-8', accuracy: 'w-6 h-6' };
    }
  };

  const getMarkerColor = () => {
    if (isPredicted) return 'bg-purple-500 border-purple-300';
    
    switch (type) {
      case 'driver': return isActive ? 'bg-green-500 border-green-300' : 'bg-gray-500 border-gray-300';
      case 'delivery': return isActive ? 'bg-blue-500 border-blue-300' : 'bg-gray-500 border-gray-300';
      default: return isActive ? 'bg-orange-500 border-orange-300' : 'bg-gray-500 border-gray-300';
    }
  };

  const getAccuracyColor = () => {
    if (accuracy < 10) return 'bg-green-200 border-green-300';
    if (accuracy < 25) return 'bg-yellow-200 border-yellow-300';
    if (accuracy < 50) return 'bg-orange-200 border-orange-300';
    return 'bg-red-200 border-red-300';
  };

  const MarkerIcon = () => {
    switch (type) {
      case 'driver':
        return <Car className="w-4 h-4 text-white" />;
      case 'delivery':
        return <Navigation className="w-4 h-4 text-white" />;
      default:
        return <Circle className="w-3 h-3 text-white fill-current" />;
    }
  };

  const sizes = getMarkerSize();

  return (
    <div className={cn("relative", className)}>
      {/* Cercle de précision */}
      <motion.div
        className={cn(
          "absolute rounded-full border-2 opacity-30",
          getAccuracyColor(),
          sizes.accuracy
        )}
        style={{
          width: Math.max(accuracy * 2, 24),
          height: Math.max(accuracy * 2, 24),
          transform: 'translate(-50%, -50%)'
        }}
        animate={{
          scale: isMoving ? [1, 1.1, 1] : 1,
          opacity: isPredicted ? [0.2, 0.4, 0.2] : 0.3
        }}
        transition={{
          duration: getPulseSpeed(),
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Marqueur principal */}
      <motion.div
        className={cn(
          "relative rounded-full border-3 shadow-lg flex items-center justify-center",
          getMarkerColor(),
          sizes.marker
        )}
        style={{
          rotate: heading
        }}
        animate={{
          scale: isMoving ? [1, 1.2, 1] : 1,
          rotate: heading,
          x: 0,
          y: 0
        }}
        transition={{
          scale: { duration: 0.3, ease: "easeOut" },
          rotate: { duration: 0.5, ease: "easeInOut" }
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MarkerIcon />
        
        {/* Indicateur de direction si en mouvement */}
        {speed > 1 && (
          <motion.div
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-white"
            animate={{
              opacity: isMoving ? 1 : 0.5,
              scale: isMoving ? [1, 1.2, 1] : 1
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity
            }}
          />
        )}
      </motion.div>

      {/* Ondulation pour mouvement rapide */}
      {speed > 10 && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white opacity-60"
          animate={{
            scale: [1, 2, 3],
            opacity: [0.6, 0.3, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}

      {/* Badge de vitesse */}
      {speed > 5 && (
        <motion.div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          {(speed * 3.6).toFixed(0)} km/h
        </motion.div>
      )}

      {/* Indicateur de prédiction */}
      {isPredicted && (
        <motion.div
          className="absolute -top-2 -right-2 w-3 h-3 bg-purple-500 rounded-full border border-white"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 1,
            repeat: Infinity
          }}
        />
      )}

      {/* Traînée de mouvement pour hautes vitesses */}
      {speed > 15 && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${heading}deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
            borderRadius: '50%',
            transform: 'scale(2)'
          }}
          animate={{
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
};

export default FluidPositionMarker;