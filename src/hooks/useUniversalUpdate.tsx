import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppUpdate } from './useAppUpdate';
import { mobileUpdateService, MobileUpdateInfo } from '@/services/mobileUpdateService';
import { UpdateInfo } from '@/types/update';
import { logger } from '@/utils/logger';

export interface UniversalUpdateInfo extends UpdateInfo {
  platform: 'web' | 'pwa' | 'ios' | 'android';
  nativeUpdateAvailable?: boolean;
  mobileInfo?: MobileUpdateInfo;
}

export interface UseUniversalUpdateReturn {
  updateAvailable: boolean;
  updateInfo: UniversalUpdateInfo | null;
  isUpdating: boolean;
  shouldShowPrompt: boolean;
  installUpdate: () => Promise<void>;
  dismissUpdate: (durationHours?: number) => void;
  platform: string;
}

export const useUniversalUpdate = (): UseUniversalUpdateReturn => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  // Hook PWA/Web
  const webUpdate = useAppUpdate();
  
  // État pour updates mobiles natives
  const [mobileUpdateInfo, setMobileUpdateInfo] = useState<MobileUpdateInfo | null>(null);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);

  // Vérifier les mises à jour mobiles
  const checkMobileUpdate = useCallback(async () => {
    if (!isNative) return;
    
    try {
      setIsCheckingMobile(true);
      const info = await mobileUpdateService.checkForUpdate();
      setMobileUpdateInfo(info);
      logger.info('Mobile update check complete', info);
    } catch (error) {
      logger.error('Mobile update check failed', error);
    } finally {
      setIsCheckingMobile(false);
    }
  }, [isNative]);

  // Vérification optimisée pour mobile (économiser batterie)
  useEffect(() => {
    if (!isNative) return;

    // Vérification initiale après 10 secondes
    const initialCheck = setTimeout(() => {
      checkMobileUpdate();
    }, 10000);

    // Vérification au retour en foreground uniquement (pas d'interval)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastCheck = localStorage.getItem('last_mobile_update_check');
        const now = Date.now();
        
        // Vérifier uniquement si 5+ minutes depuis dernière vérification
        if (!lastCheck || now - parseInt(lastCheck) > 5 * 60 * 1000) {
          checkMobileUpdate();
          localStorage.setItem('last_mobile_update_check', now.toString());
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialCheck);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isNative, checkMobileUpdate]);

  // Installer la mise à jour
  const [isUpdating, setIsUpdating] = useState(false);

  const installUpdate = async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);

      if (isNative && mobileUpdateInfo?.updateAvailable) {
        if (platform === 'ios') {
          // iOS : Redirection vers App Store
          mobileUpdateService.openAppStore();
          logger.info('iOS: Redirecting to App Store');
        } else {
          // Android : In-app update avec préférence pour flexible
          if (mobileUpdateInfo.flexibleUpdateAllowed) {
            // Flexible update géré par useFlexibleUpdate hook
            await mobileUpdateService.startFlexibleUpdateWithTracking();
            logger.info('Android: Flexible update with tracking started');
          } else if (mobileUpdateInfo.immediateUpdateAllowed) {
            await mobileUpdateService.performImmediateUpdate();
            logger.info('Android: Immediate update started');
          } else {
            // Fallback vers Play Store si aucune méthode disponible
            mobileUpdateService.openAppStore();
            logger.info('Android: Fallback to Play Store');
          }
        }
      } else {
        // Web/PWA : Utiliser le service de mise à jour web
        await webUpdate.installUpdate();
        logger.info('Web/PWA: Update installed');
      }
    } catch (error) {
      logger.error('Universal update installation failed', error);
      setIsUpdating(false);
      throw error;
    }
  };

  // Combiner les infos de mise à jour
  const combinedUpdateInfo: UniversalUpdateInfo | null = webUpdate.updateInfo ? {
    ...webUpdate.updateInfo,
    platform: isNative ? (platform as 'ios' | 'android') : 'web',
    nativeUpdateAvailable: mobileUpdateInfo?.updateAvailable,
    mobileInfo: mobileUpdateInfo || undefined
  } : null;

  const updateAvailable = webUpdate.updateAvailable || (mobileUpdateInfo?.updateAvailable ?? false);

  return {
    updateAvailable,
    updateInfo: combinedUpdateInfo,
    isUpdating: isUpdating || webUpdate.isUpdating || isCheckingMobile,
    shouldShowPrompt: (webUpdate.shouldShowPrompt || (mobileUpdateInfo?.updateAvailable ?? false)) && updateAvailable,
    installUpdate,
    dismissUpdate: webUpdate.dismissUpdate,
    platform
  };
};
