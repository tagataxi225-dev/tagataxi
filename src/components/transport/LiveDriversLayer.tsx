/**
 * 🗺️ Couche d'affichage des chauffeurs en temps réel sur la carte
 * Affiche tous les chauffeurs disponibles avec leurs markers animés
 */

import React, { useEffect, useState } from 'react';
import { useLiveDrivers } from '@/hooks/useLiveDrivers';
import DriverMarkerSimple from '@/components/maps/DriverMarkerSimple';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/utils/logger';

interface LiveDriversLayerProps {
  map: google.maps.Map | null;
  userLocation: { lat: number; lng: number } | null;
  maxRadius?: number;
  showOnlyAvailable?: boolean;
  onDriverClick?: (driverId: string) => void;
}

export default function LiveDriversLayer({
  map,
  userLocation,
  maxRadius = 10,
  showOnlyAvailable = true,
  onDriverClick
}: LiveDriversLayerProps) {
  const { liveDrivers, loading, driversCount } = useLiveDrivers({
    userLocation,
    maxRadius,
    showOnlyAvailable,
    updateInterval: 10000
  });

  // 🎛️ État de visibilité de la couche chauffeurs
  const [isLayerVisible, setIsLayerVisible] = useState(true);

  logger.debug(`[LiveDriversLayer] Affichage de ${driversCount} chauffeurs, visible: ${isLayerVisible}`);

  return (
    <>
      {/* Toggle Button - Style Yango */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute top-32 left-4 z-10"
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsLayerVisible(!isLayerVisible)}
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 px-4 py-2 h-auto transition-all"
        >
          {isLayerVisible ? (
            <Eye className="w-4 h-4 mr-2 text-secondary" />
          ) : (
            <EyeOff className="w-4 h-4 mr-2 text-gray-400" />
          )}
          <span className="text-sm font-medium">
            {isLayerVisible ? 'Masquer' : 'Afficher'} chauffeurs
          </span>
        </Button>
      </motion.div>

      {/* Badge compteur de chauffeurs - Conditionnel */}
      <AnimatePresence>
        {isLayerVisible && driversCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-20 right-4 z-10"
          >
            <Badge 
              variant="secondary" 
              className="bg-primary/90 text-white backdrop-blur-md shadow-lg px-4 py-2 border-none"
            >
              <Car className="w-4 h-4 mr-2" />
              <span className="font-bold">{driversCount}</span>
              <span className="ml-1">
                disponible{driversCount > 1 ? 's' : ''}
              </span>
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Affichage des markers de chauffeurs - Conditionnel */}
      <AnimatePresence>
        {isLayerVisible && !loading && liveDrivers.map((driver) => (
          <DriverMarkerSimple
            key={driver.driver_id}
            map={map}
            position={{ lat: driver.latitude, lng: driver.longitude }}
            heading={driver.heading || 0}
            driverName={driver.driver_name}
            isAvailable={driver.is_available}
            onClick={() => onDriverClick?.(driver.driver_id)}
          />
        ))}
      </AnimatePresence>
    </>
  );
}
