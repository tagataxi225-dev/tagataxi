import { useState } from 'react';
import { X } from 'lucide-react';
import { useAppUpdate } from '@/hooks/useAppUpdate';

/**
 * Bannière fixe en bas d'écran proposant la mise à jour de l'app
 * lorsqu'une nouvelle version est disponible sur le store.
 * Le rejet ("X") est mémorisé par version dans localStorage.
 */
export function AppUpdateBanner() {
  const { updateAvailable, availableVersion, performUpdate } = useAppUpdate();

  const dismissKey = `kwenda_update_dismissed_${availableVersion ?? 'latest'}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey) === '1';
    } catch {
      return false;
    }
  });

  if (!updateAvailable || dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissKey, '1');
    } catch {
      /* localStorage indisponible — on masque quand même pour la session */
    }
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-t-2xl bg-white p-4 shadow-lg">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            Nouvelle version disponible
          </p>
          <p className="text-xs text-gray-500">
            Mettez à jour pour profiter des dernières améliorations.
          </p>
        </div>

        <button
          type="button"
          onClick={performUpdate}
          onTouchEnd={performUpdate}
          style={{ touchAction: 'manipulation' }}
          className="shrink-0 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm active:bg-green-700"
        >
          Mettre à jour
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          onTouchEnd={handleDismiss}
          style={{ touchAction: 'manipulation' }}
          aria-label="Ignorer"
          className="shrink-0 rounded-full p-1 text-gray-400 active:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
