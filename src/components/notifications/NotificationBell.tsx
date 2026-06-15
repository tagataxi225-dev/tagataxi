import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { UnifiedNotificationBell } from './UnifiedNotificationBell';
import type { UserType } from '@/hooks/useUnifiedNotifications';

/**
 * ✅ PHASE 3: Wrapper compatible avec ancien système
 * Détecte automatiquement le rôle et utilise UnifiedNotificationBell
 */
export const NotificationBell = () => {
  const { userRole } = useUserRole();

  // Mapper les rôles vers UserType
  const userTypeMapping: Record<string, UserType> = {
    'admin': 'admin',
    'vendor': 'vendor',
    'driver': 'driver',
    'client': 'client',
    'restaurant': 'restaurant',
    'partner': 'partner'
  };

  const userType = userTypeMapping[userRole || 'client'] || 'client';

  return <UnifiedNotificationBell userType={userType} />;
};
