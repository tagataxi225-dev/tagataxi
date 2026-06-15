import { useState, useEffect, useCallback } from 'react';
import { checkForUpdate, StoreUpdateInfo } from '@/services/appUpdateService';
import { logger } from '@/utils/logger';

const DISMISS_KEY = 'kwenda_store_update_dismissed_at';

export function useStoreUpdate() {
  const [showDialog, setShowDialog] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<StoreUpdateInfo | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const info = await checkForUpdate();
        if (!info.updateAvailable) return;

        // If mandatory, always show
        if (info.isMandatory) {
          setUpdateInfo(info);
          setShowDialog(true);
          return;
        }

        // Throttle: don't show if dismissed < 24h ago
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
          const elapsed = Date.now() - Number(dismissedAt);
          if (elapsed < 24 * 60 * 60 * 1000) return;
        }

        setUpdateInfo(info);
        setShowDialog(true);
      } catch (err) {
        logger.warn('Store update check failed', err);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowDialog(false);
  }, []);

  const openStore = useCallback(() => {
    if (updateInfo?.storeUrl) {
      window.open(updateInfo.storeUrl, '_system');
    }
  }, [updateInfo]);

  return { showDialog, updateInfo, dismiss, openStore };
}
