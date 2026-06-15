import { useState, useEffect } from 'react';
import { pwaInstaller } from '@/utils/downloadUtils';

export interface InstallPromptHook {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: 'ios' | 'android' | 'desktop';
  install: () => Promise<boolean>;
  dismiss: () => void;
}

export const useInstallPrompt = (): InstallPromptHook => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const standalone = pwaInstaller.isStandalone();
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // Vérifier si l'installation est disponible
    setCanInstall(pwaInstaller.canInstall());

    // Écouter les changements d'état
    const checkInstallability = () => {
      setCanInstall(pwaInstaller.canInstall());
    };

    window.addEventListener('beforeinstallprompt', checkInstallability);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', checkInstallability);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    const result = await pwaInstaller.installPWA();
    if (result) {
      setIsInstalled(true);
      setCanInstall(false);
    }
    return result;
  };

  const dismiss = () => {
    setCanInstall(false);
  };

  return {
    canInstall,
    isInstalled,
    isStandalone,
    platform: pwaInstaller.getDeviceType(),
    install,
    dismiss
  };
};
