/**
 * useAppServices — Hook centralisé pour les services globaux
 * Regroupe useOrderCleanup, useServiceRealtime, useRealtimeNotifications
 * Ne s'active que si l'utilisateur est authentifié
 */

import { useEffect } from 'react';
import { useOrderCleanup } from '@/hooks/useOrderCleanup';
import { useServiceRealtime } from '@/hooks/useServiceRealtime';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export const useAppServices = () => {
  useOrderCleanup();
  useServiceRealtime();
  useRealtimeNotifications();
};
