/**
 * 📍 PHASE 4: Hook React pour Background Tracking
 * Gère le cycle de vie du tracking GPS en arrière-plan
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useDriverStatus } from './useDriverStatus';
import { backgroundGeolocationService } from '@/services/backgroundGeolocationService';
import { toast } from 'sonner';

export const useBackgroundTracking = () => {
  const { user } = useAuth();
  const { status } = useDriverStatus();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Démarrer le tracking automatiquement quand le chauffeur passe en ligne
   */
  useEffect(() => {
    if (!user) return;

    const handleOnlineStatusChange = async () => {
      if (status.isOnline && !isTracking) {
        // Chauffeur en ligne → démarrer tracking
        const success = await startTracking();
        if (!success) {
          toast.error('Impossible de démarrer le tracking GPS', {
            description: 'Veuillez vérifier vos permissions de localisation'
          });
        }
      } else if (!status.isOnline && isTracking) {
        // Chauffeur hors ligne → arrêter tracking
        await stopTracking();
      }
    };

    handleOnlineStatusChange();
  }, [status.isOnline, user]);

  /**
   * Démarrer le tracking GPS
   */
  const startTracking = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError('Utilisateur non connecté');
      return false;
    }

    try {
      setError(null);
      const success = await backgroundGeolocationService.startTracking(user.id);
      
      if (success) {
        setIsTracking(true);
        console.log('✅ Background tracking started');
        
        // Synchroniser les updates offline au démarrage
        setTimeout(() => {
          backgroundGeolocationService.syncOfflineUpdates();
        }, 2000);
        
        return true;
      } else {
        setError('Échec du démarrage du tracking');
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur inconnue';
      setError(errorMsg);
      console.error('❌ Failed to start tracking:', err);
      return false;
    }
  }, [user]);

  /**
   * Arrêter le tracking GPS
   */
  const stopTracking = useCallback(async (): Promise<void> => {
    try {
      await backgroundGeolocationService.stopTracking();
      setIsTracking(false);
      console.log('⏹️ Background tracking stopped');
    } catch (err: any) {
      console.error('❌ Failed to stop tracking:', err);
    }
  }, []);

  /**
   * Synchroniser les updates offline
   */
  const syncOfflineUpdates = useCallback(async (): Promise<void> => {
    try {
      await backgroundGeolocationService.syncOfflineUpdates();
      toast.success('Positions synchronisées');
    } catch (err: any) {
      console.error('❌ Failed to sync offline updates:', err);
    }
  }, []);

  /**
   * Nettoyer au démontage
   */
  useEffect(() => {
    return () => {
      if (isTracking) {
        backgroundGeolocationService.stopTracking();
      }
    };
  }, [isTracking]);

  return {
    isTracking,
    error,
    startTracking,
    stopTracking,
    syncOfflineUpdates
  };
};
