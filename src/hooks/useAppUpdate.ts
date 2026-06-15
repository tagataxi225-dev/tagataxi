import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';
import { secureLog } from '@/utils/secureLogger';

/**
 * Détecte si une nouvelle version est disponible sur le store (natif uniquement)
 * et expose une action pour ouvrir la fiche du store.
 */
export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  // Identifiant de la version disponible — sert à clé de "dismiss" persistante
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);

  useEffect(() => {
    // getAppUpdateInfo() n'est pas implémenté sur le web → on ne tente qu'en natif
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    (async () => {
      try {
        const info = await AppUpdate.getAppUpdateInfo();
        if (cancelled) return;

        if (info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
          setUpdateAvailable(true);
          // availableVersionCode (Android) sinon availableVersionName (iOS)
          setAvailableVersion(
            info.availableVersionCode ?? info.availableVersionName ?? 'latest'
          );
        }
      } catch (err) {
        secureLog.warn('useAppUpdate: getAppUpdateInfo failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const performUpdate = useCallback(async () => {
    try {
      await AppUpdate.openAppStore();
    } catch (err) {
      secureLog.error('useAppUpdate: openAppStore failed', err);
    }
  }, []);

  return { updateAvailable, availableVersion, performUpdate };
}
