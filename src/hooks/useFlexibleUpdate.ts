import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { mobileUpdateService } from '@/services/mobileUpdateService';
import { logger } from '@/utils/logger';

export type FlexibleUpdateStatus = 
  | 'idle' 
  | 'checking' 
  | 'available' 
  | 'downloading' 
  | 'ready' 
  | 'installing'
  | 'error';

export interface FlexibleUpdateState {
  status: FlexibleUpdateStatus;
  progress: number;
  bytesDownloaded: number;
  totalBytes: number;
  error: string | null;
}

export interface UseFlexibleUpdateReturn extends FlexibleUpdateState {
  isDownloading: boolean;
  isReadyToInstall: boolean;
  isInstalling: boolean;
  installNow: () => Promise<void>;
  checkForUpdate: () => Promise<void>;
}

const DELAY_AFTER_SPLASH_MS = 3000;
const AUTO_INSTALL_DELAY_MS = 2000;

export const useFlexibleUpdate = (): UseFlexibleUpdateReturn => {
  const [state, setState] = useState<FlexibleUpdateState>({
    status: 'idle',
    progress: 0,
    bytesDownloaded: 0,
    totalBytes: 0,
    error: null
  });
  
  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  const hasCheckedRef = useRef(false);
  const isListeningRef = useRef(false);

  // Configurer les callbacks de progression
  const setupListeners = useCallback(() => {
    if (isListeningRef.current) return;
    isListeningRef.current = true;

    mobileUpdateService.onProgress(({ progress, bytesDownloaded, totalBytes }) => {
      setState(prev => ({
        ...prev,
        status: 'downloading',
        progress: Math.round(progress),
        bytesDownloaded,
        totalBytes
      }));
      logger.debug('Flexible update progress', { progress, bytesDownloaded, totalBytes });
    });

    mobileUpdateService.onDownloadComplete(() => {
      setState(prev => ({ ...prev, status: 'ready', progress: 100 }));
      logger.info('Flexible update download complete');
      
      // Auto-install après un court délai
      setTimeout(async () => {
        try {
          setState(prev => ({ ...prev, status: 'installing' }));
          await mobileUpdateService.completeFlexibleUpdate();
          logger.info('Flexible update installation triggered');
        } catch (error) {
          logger.error('Auto-install failed', error);
          // Reste sur 'ready' pour permettre installation manuelle
          setState(prev => ({ ...prev, status: 'ready' }));
        }
      }, AUTO_INSTALL_DELAY_MS);
    });
  }, []);

  // Vérifier et démarrer le flexible update
  const checkForUpdate = useCallback(async () => {
    if (!isAndroid) return;
    
    try {
      setState(prev => ({ ...prev, status: 'checking', error: null }));
      
      const info = await mobileUpdateService.checkForUpdate();
      logger.info('Flexible update check result', info);
      
      if (info.updateAvailable && info.flexibleUpdateAllowed) {
        setState(prev => ({ ...prev, status: 'available' }));
        
        // Configurer les listeners avant de démarrer
        setupListeners();
        
        // Démarrer le flexible update (affiche popup Google Play)
        await mobileUpdateService.startFlexibleUpdateWithTracking();
        logger.info('Flexible update started');
      } else if (info.updateAvailable && !info.flexibleUpdateAllowed) {
        // Update disponible mais pas flexible (peut-être immediate only)
        logger.info('Update available but flexible not allowed');
        setState(prev => ({ ...prev, status: 'idle' }));
      } else {
        setState(prev => ({ ...prev, status: 'idle' }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update check failed';
      logger.error('Flexible update check failed', error);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: errorMessage 
      }));
    }
  }, [isAndroid, setupListeners]);

  // Installation manuelle
  const installNow = useCallback(async () => {
    if (state.status !== 'ready') return;
    
    try {
      setState(prev => ({ ...prev, status: 'installing' }));
      await mobileUpdateService.completeFlexibleUpdate();
      logger.info('Manual flexible update installation triggered');
    } catch (error) {
      logger.error('Manual install failed', error);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: 'Installation failed' 
      }));
    }
  }, [state.status]);

  // Vérification au montage (après splash screen)
  useEffect(() => {
    if (!isAndroid || hasCheckedRef.current) return;
    
    const timer = setTimeout(() => {
      hasCheckedRef.current = true;
      checkForUpdate();
    }, DELAY_AFTER_SPLASH_MS);
    
    return () => clearTimeout(timer);
  }, [isAndroid, checkForUpdate]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (isListeningRef.current) {
        mobileUpdateService.removeListeners();
        isListeningRef.current = false;
      }
    };
  }, []);

  return {
    ...state,
    isDownloading: state.status === 'downloading',
    isReadyToInstall: state.status === 'ready',
    isInstalling: state.status === 'installing',
    installNow,
    checkForUpdate
  };
};
