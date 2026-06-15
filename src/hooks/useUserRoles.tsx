import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleInfo, Permission, UserRole, AdminRole } from '@/types/roles';
import { useSelectedRole } from './useSelectedRole';
import { logger } from '@/utils/logger';
import { secureLog } from '@/utils/secureLogger';

interface UseUserRolesReturn {
  userRoles: UserRoleInfo[];
  permissions: Permission[];
  primaryRole: UserRole | null;
  adminRole: AdminRole | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isDegradedMode: boolean;
}

const CACHE_KEY = 'kwenda_user_roles_cache';
const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

// 🔐 SÉCURITÉ PHASE 2: Import du stockage chiffré
import { secureStorage, migrateToSecureStorage } from '@/utils/secureStorage';

const getCachedRoles = (): { data: UserRoleInfo[] | null; timestamp: number | null } => {
  try {
    // Migration automatique des anciennes données non chiffrées
    migrateToSecureStorage(CACHE_KEY);
    
    const cached = secureStorage.getItem(CACHE_KEY);
    if (!cached) return { data: null, timestamp: null };
    
    const { data, timestamp } = cached;
    const now = Date.now();
    
    if (now - timestamp > CACHE_EXPIRATION) {
      secureStorage.removeItem(CACHE_KEY);
      return { data: null, timestamp: null };
    }
    
    return { data, timestamp };
  } catch (error) {
    console.error('❌ Erreur lecture cache sécurisé:', error);
    secureStorage.removeItem(CACHE_KEY);
    return { data: null, timestamp: null };
  }
};

const setCachedRoles = (data: UserRoleInfo[]) => {
  try {
    secureStorage.setItem(CACHE_KEY, { data, timestamp: Date.now() });
  } catch (error) {
    console.warn('Failed to cache roles:', error);
  }
};

export const useUserRoles = (): UseUserRolesReturn => {
  const { user, sessionReady } = useAuth();
  const { selectedRole } = useSelectedRole();
  const [isDegradedMode, setIsDegradedMode] = useState(false);

  const fetchUserRoles = async (): Promise<{ roles: UserRoleInfo[]; permissions: Permission[] }> => {
    logger.debug('🔍 [UserRoles] Starting fetch', { userId: user?.id, sessionReady });
    if (!user?.id) {
      const defaultRole = {
        role: 'client' as UserRole,
        admin_role: undefined,
        permissions: ['transport_read', 'marketplace_read'] as Permission[]
      };
      return { roles: [defaultRole], permissions: ['transport_read', 'marketplace_read'] };
    }

    try {
      console.log('🔍 [UserRoles] Fetching roles via RPC for user:', user.id);

      const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles', {
        p_user_id: user.id
      });

      if (rolesError) {
        // ✅ CORRECTION : Distinguer types d'erreurs pour messages contextuels
        const isRLSError = rolesError.message?.includes('policy') || 
                           rolesError.message?.includes('infinite recursion') ||
                           rolesError.code === '42P17'; // Code erreur récursion Postgres
        
        const isNetworkError = rolesError.message?.includes('fetch') || 
                               rolesError.message?.includes('network');
        
        if (isRLSError) {
          logger.error('[UserRoles] 🔴 ERREUR RLS DÉTECTÉE - Récursion infinie probable');
          throw new Error('POLICY_RECURSION: Problème de configuration RLS. Contactez le support.');
        }
        
        if (isNetworkError) {
          logger.warn('[UserRoles] ⚠️ Erreur réseau - Retry automatique');
        }
        
        console.error('❌ [UserRoles] RPC Error:', {
          message: rolesError.message,
          code: rolesError.code,
          details: rolesError.details,
          hint: rolesError.hint
        });
        
        // ✅ Si erreur d'authentification, forcer le rechargement de la session
        if (rolesError.message?.includes('Authentication required') || 
            rolesError.message?.includes('JWT') ||
            rolesError.message?.includes('session not initialized')) {
          console.warn('⚠️ [UserRoles] Session invalide, rechargement...');
          await supabase.auth.refreshSession();
          throw rolesError; // Retry via React Query
        }
        
        throw rolesError;
      }

      if (rolesData && rolesData.length > 0) {
        console.log('✅ [UserRoles] Roles retrieved:', rolesData);
        
        const rolesWithTypedInfo: UserRoleInfo[] = rolesData.map((item: any) => ({
          role: item.role as UserRole,
          admin_role: item.admin_role as AdminRole || undefined,
          permissions: item.permissions || []
        }));

        const allPermissions = Array.from(
          new Set(rolesWithTypedInfo.flatMap(role => role.permissions))
        ) as Permission[];

        setCachedRoles(rolesWithTypedInfo);
        setIsDegradedMode(false);
        
        return { roles: rolesWithTypedInfo, permissions: allPermissions };
      }

      secureLog.log('⚠️ [UserRoles] No roles found, defaulting to client');
      const defaultRole = {
        role: 'client' as UserRole,
        admin_role: undefined,
        permissions: ['transport_read', 'marketplace_read'] as Permission[]
      };
      
      setCachedRoles([defaultRole]);
      return { roles: [defaultRole], permissions: ['transport_read', 'marketplace_read'] };

    } catch (err) {
      secureLog.error('❌ [UserRoles] Error in fetchUserRoles:', err);
      
      // ✅ NOUVEAU : Détecter spécifiquement les erreurs de refresh token invalide
      const errorMessage = (err as any)?.message || '';
      const isTokenError = errorMessage.includes('refresh_token_not_found') ||
                           errorMessage.includes('Invalid Refresh Token') ||
                           errorMessage.includes('Refresh Token Not Found');
      
      if (isTokenError) {
        secureLog.error('🔴 [UserRoles] REFRESH TOKEN INVALIDE - Forcer déconnexion');
        
        // Nettoyer tout le localStorage
        secureStorage.removeItem(CACHE_KEY);
        localStorage.removeItem('kwenda_login_intent');
        localStorage.removeItem('kwenda_selected_role');
        localStorage.removeItem('kwenda_profile_cache');
        
        // Poser le flag anti-boucle avant signOut
        localStorage.setItem('kwenda_signing_out', 'true');
        
        // Forcer déconnexion complète
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        
        // Rediriger vers auth appropriée
        const currentPath = window.location.pathname;
        if (currentPath.includes('/admin') || currentPath.includes('/operatorx')) {
          window.location.href = '/operatorx/admin/auth';
        } else if (currentPath.includes('/driver')) {
          window.location.href = '/driver/auth';
        } else if (currentPath.includes('/partner')) {
          window.location.href = '/partner/auth';
        } else {
          window.location.href = '/auth';
        }
        
        throw new Error('Session expirée. Reconnexion requise.');
      }
      
      // Mode dégradé : utiliser le cache si disponible
      const { data: cachedData } = getCachedRoles();
      if (cachedData) {
        console.warn('⚠️ [UserRoles] Using cached roles (degraded mode)');
        setIsDegradedMode(true);
        const allPermissions = Array.from(
          new Set(cachedData.flatMap(role => role.permissions))
        ) as Permission[];
        return { roles: cachedData, permissions: allPermissions };
      }
      
      // Fallback ultime
      const defaultRole = {
        role: 'client' as UserRole,
        admin_role: undefined,
        permissions: ['transport_read', 'marketplace_read'] as Permission[]
      };
      return { roles: [defaultRole], permissions: ['transport_read', 'marketplace_read'] };
    }
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: fetchUserRoles,
    staleTime: 5 * 60 * 1000, // ✅ 5 min (était 60 secondes)
    gcTime: 10 * 60 * 1000, // ✅ 10 minutes (était 5 min)
    enabled: !!user?.id && sessionReady, // ✅ Attendre que la session soit prête
    retry: 2, // ✅ 2 retries max (3 tentatives total) pour éviter blocage 15s
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000),
    refetchOnWindowFocus: true, // ✅ RÉACTIVER pour rafraîchir si fenêtre inactive
    refetchInterval: 5 * 60 * 1000, // ✅ AJOUTER polling toutes les 5 minutes
    refetchOnReconnect: true, // ✅ Rafraîchir après reconnexion
  });

  const userRoles = data?.roles || [];
  const permissions = data?.permissions || [];

  // Utilitaires pour vérifier les permissions
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasRole = (role: UserRole): boolean => {
    return userRoles.some(userRole => userRole.role === role);
  };

  // Calculer le rôle principal : utiliser le rôle sélectionné si disponible
  // Pour les utilisateurs multi-rôles, respecter l'intention de connexion
  const loginIntent = localStorage.getItem('kwenda_login_intent') as UserRole | null;
  
  const primaryRole: UserRole | null = selectedRole || (
    userRoles.length === 1 
      ? userRoles[0]?.role || null  // Un seul rôle → on le prend
      : (loginIntent && userRoles.some(r => r.role === loginIntent) ? loginIntent : null)  // Multi-rôles → utiliser loginIntent
  );

  // Obtenir le rôle admin s'il existe
  const adminRole: AdminRole | null = userRoles.find(role => role.admin_role)?.admin_role || null;

  const isAdmin = hasRole('admin');
  const isSuperAdmin = adminRole === 'super_admin';

  return {
    userRoles,
    permissions,
    primaryRole,
    adminRole,
    hasPermission,
    hasAnyPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    loading: isLoading,
    error: error ? 'Erreur lors du chargement des rôles' : null,
    refetch: async () => { await refetch(); },
    isDegradedMode
  };
};