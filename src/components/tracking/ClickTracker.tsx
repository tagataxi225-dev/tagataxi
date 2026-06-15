/**
 * Composant global pour tracker les clics pour heatmaps
 */

import { useClickTracking } from '@/hooks/useClickTracking';

export const ClickTracker = () => {
  // Activer le tracking global
  useClickTracking({
    enabled: true,
    ignoredSelectors: [
      '.no-track',
      '[data-no-track]',
      'button[data-admin]',
      '.admin-panel'
    ]
  });

  return null; // Composant headless
};
