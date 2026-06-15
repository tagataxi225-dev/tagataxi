import { useNavigate } from 'react-router-dom';
import { useUserRoles } from './useUserRoles';
import { UserRole } from '@/types/roles';

/**
 * Hook centralisé pour la navigation basée sur les rôles
 * Remplace tous les usages de user.user_metadata.role
 */
export const useRoleBasedNavigation = () => {
  const navigate = useNavigate();
  const { primaryRole, loading } = useUserRoles();

  /**
   * Retourne le chemin de redirection selon le rôle principal
   */
  const getRedirectPath = (role: UserRole | null): string => {
    if (!role) return '/app/auth';
    
    switch (role) {
      case 'admin':
        return '/operatorx/admin';
      case 'partner':
        return '/app/partenaire';
      case 'driver':
        return '/app/chauffeur';
      case 'client':
        return '/app/client';
      default:
        return '/';
    }
  };

  /**
   * Navigue vers la page appropriée selon le rôle
   */
  const navigateToRolePage = () => {
    const path = getRedirectPath(primaryRole);
    navigate(path);
  };

  /**
   * Vérifie si l'utilisateur a le bon rôle pour la page actuelle
   */
  const canAccessRoute = (requiredRole: UserRole): boolean => {
    return primaryRole === requiredRole;
  };

  return {
    primaryRole,
    loading,
    getRedirectPath,
    navigateToRolePage,
    canAccessRoute
  };
};
