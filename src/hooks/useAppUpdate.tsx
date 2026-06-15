import { useState, useEffect } from 'react';
import { updateService } from '@/services/updateService';
import { UpdateInfo } from '@/types/update';
import { logger } from '@/utils/logger';

export interface UseAppUpdateReturn {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  isUpdating: boolean;
  shouldShowPrompt: boolean;
  installUpdate: () => Promise<void>;
  dismissUpdate: (durationHours?: number) => void;
}

export const useAppUpdate = (): UseAppUpdateReturn => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(true);

  useEffect(() => {
    // Initialiser le service
    updateService.initialize();

    // Activer la vérification intelligente
    updateService.enableSmartChecking();

    // Vérifier si on doit afficher le prompt
    setShouldShowPrompt(updateService.shouldShowPrompt());

    // Écouter les mises à jour
    updateService.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setUpdateAvailable(true);
      logger.info('Update detected', info);
    });

    // Vérification initiale après 10 secondes
    const timeout = setTimeout(() => {
      updateService.checkForUpdates();
    }, 10000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const installUpdate = async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      await updateService.installUpdate();
      
      // Attendre un peu pour l'animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recharger la page
      window.location.reload();
    } catch (error) {
      logger.error('Update installation failed', error);
      setIsUpdating(false);
    }
  };

  const dismissUpdate = (durationHours: number = 24) => {
    const durationMs = durationHours * 60 * 60 * 1000;
    updateService.skipUpdate(durationMs);
    setUpdateAvailable(false);
    setShouldShowPrompt(false);
  };

  return {
    updateAvailable,
    updateInfo,
    isUpdating,
    shouldShowPrompt: shouldShowPrompt && updateAvailable,
    installUpdate,
    dismissUpdate
  };
};
