import { useNavigate } from 'react-router-dom';
import { useAppReady } from '@/contexts/AppReadyContext';
import { useUserRoles } from '@/hooks/useUserRoles';

/**
 * 🛡️ HOOK DE NAVIGATION PROTÉGÉE
 * Empêche les utilisateurs authentifiés de naviguer vers les routes publiques
 * Seule sortie possible : déconnexion
 */
export const useProtectedNavigation = () => {
  const { user } = useAppReady();
  const { primaryRole } = useUserRoles();
  const navigate = useNavigate();

  // Routes publiques interdites aux utilisateurs connectés (exclut les auth spécialisées pour changement de rôle)
  const PUBLIC_ROUTES = ['/', '/landing', '/auth'];

  /**
   * Retourne le chemin du dashboard selon le rôle
   */
  const getDashboardPath = (): string => {
    switch (primaryRole) {
      case 'driver':
        return '/app/chauffeur';
      case 'partner':
        return '/app/partenaire';
      case 'admin':
        return '/operatorx/admin';
      case 'restaurant':
        return '/app/restaurant';
      case 'client':
      default:
        return '/app/client';
    }
  };

  /**
   * Navigation sécurisée - bloque les routes publiques si connecté
   */
  const navigateSafe = (path: string, options?: { replace?: boolean }) => {
    if (user && PUBLIC_ROUTES.some(r => path === r || path.startsWith(r + '/'))) {
      console.warn('🚫 [ProtectedNav] Navigation vers route publique bloquée:', path);
      navigate(getDashboardPath(), { replace: true });
      return false;
    }
    
    navigate(path, options);
    return true;
  };

  /**
   * Redirection vers le dashboard approprié
   */
  const goToDashboard = () => {
    const dashboardPath = getDashboardPath();
    console.log('🏠 [ProtectedNav] Redirection vers dashboard:', dashboardPath);
    navigate(dashboardPath, { replace: true });
  };

  /**
   * Vérifie si une route est publique
   */
  const isPublicRoute = (path: string): boolean => {
    return PUBLIC_ROUTES.some(r => path === r || path.startsWith(r + '/'));
  };

  return {
    navigateSafe,
    goToDashboard,
    getDashboardPath,
    isPublicRoute,
    isAuthenticated: !!user,
    primaryRole
  };
};

/**
 * Fonction utilitaire pour obtenir le dashboard path depuis localStorage
 * Utile dans les class components (ErrorBoundary, SafetyNet)
 */
export const getDashboardPathFromStorage = (): string => {
  const selectedRole = localStorage.getItem('kwenda_selected_role');
  
  switch (selectedRole) {
    case 'driver':
      return '/app/chauffeur';
    case 'partner':
      return '/app/partenaire';
    case 'admin':
      return '/operatorx/admin';
    case 'restaurant':
      return '/app/restaurant';
    case 'client':
    default:
      return '/app/client';
  }
};
