import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppReady } from '@/contexts/AppReadyContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSelectedRole } from '@/hooks/useSelectedRole';
import { APP_CONFIG } from '@/config/appConfig';
import { InvisibleLoadingBar } from '@/components/loading/InvisibleLoadingBar';
import { useBlockBackNavigation } from '@/hooks/useBlockBackNavigation';
import { getDashboardPathFromStorage } from '@/hooks/useProtectedNavigation';
import { logger } from '@/utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'client' | 'driver' | 'partner' | 'admin';
}

const ProtectedRoute = ({ children, requireAuth = true, requiredRole }: ProtectedRouteProps) => {
  const { user, sessionReady, contentReady } = useAppReady();
  const { userRoles, primaryRole, loading: rolesLoading } = useUserRoles();
  const { hasSelectedRole, setSelectedRole, selectedRole } = useSelectedRole();
  const location = useLocation();

  useBlockBackNavigation(requireAuth && !!user);

  useEffect(() => {
    if (user && requireAuth) {
      window.history.replaceState(
        { protected: true, path: location.pathname },
        '',
        location.pathname
      );
    }
  }, [user, requireAuth, location.pathname]);

  // 🛡️ Auto-sélection du rôle en useEffect — ne jamais return null dans le render
  useEffect(() => {
    if (!user || rolesLoading || userRoles.length <= 1 || hasSelectedRole()) return;

    const loginIntent = localStorage.getItem('kwenda_login_intent');

    if (loginIntent && loginIntent !== 'client' && loginIntent !== 'vendor') {
      const intentRole = loginIntent as 'driver' | 'partner' | 'admin';
      if (userRoles.some(ur => ur.role === intentRole)) {
        setSelectedRole(intentRole);
        localStorage.removeItem('kwenda_login_intent');
        return;
      }
    }

    const hasClientRole = userRoles.some(ur => ur.role === 'client');
    if (hasClientRole) {
      setSelectedRole('client');
    }
  }, [user, rolesLoading, userRoles, hasSelectedRole, setSelectedRole]);

  logger.debug('[ProtectedRoute] State check', {
    path: location.pathname,
    requireAuth,
    requiredRole,
    hasUser: !!user,
    sessionReady,
    contentReady,
    rolesLoading,
    userRolesCount: userRoles.length
  });

  // 🛡️ Si déconnexion en cours, ne pas bloquer
  if (localStorage.getItem('kwenda_signing_out')) {
    return <>{children}</>;
  }

  // 🛡️ Connexion en cours — session pas encore propagée, évite la redirection vers /auth
  if (user && !rolesLoading) {
    localStorage.removeItem('kwenda_login_in_progress');
    localStorage.removeItem('kwenda_login_time');
  }
  if (localStorage.getItem('kwenda_login_in_progress')) {
    return <InvisibleLoadingBar />;
  }

  // 🛡️ Délai de grâce 3s après login : session Supabase peut mettre ~1-2s à se propager
  const loginTime = localStorage.getItem('kwenda_login_time');
  if (requireAuth && !user && loginTime && (Date.now() - parseInt(loginTime, 10)) < 3000) {
    return <InvisibleLoadingBar />;
  }

  // 🛡️ Driver vient de se connecter — rôles pas encore chargés, ne jamais rediriger vers /driver/auth
  if (requireAuth && !user && rolesLoading && localStorage.getItem('kwenda_selected_role') === 'driver') {
    return <InvisibleLoadingBar />;
  }

  if (!sessionReady || !contentReady) {
    logger.debug('[ProtectedRoute] Waiting for session/content ready...');
    return <InvisibleLoadingBar />;
  }

  // 🛡️ Route publique (requireAuth=false) : rediriger les utilisateurs connectés vers dashboard
  if (!requireAuth && user) {
    const dashboardPath = getDashboardPathFromStorage();
    logger.debug('[ProtectedRoute] Utilisateur connecté sur route publique, redirection:', dashboardPath);
    return <Navigate to={dashboardPath} replace />;
  }

  if (requireAuth && !user) {
    const authRoutes: Record<string, string> = {
      'admin': '/operatorx/admin/auth',
      'driver': '/driver/auth',
      'partner': '/partner/auth',
      'restaurant': '/restaurant/auth',
      'client': '/auth'
    };
    const targetAuth = requiredRole ? authRoutes[requiredRole] || APP_CONFIG.authRoute : APP_CONFIG.authRoute;
    logger.debug('[ProtectedRoute] No user, redirecting to:', targetAuth);
    return <Navigate to={targetAuth} state={{ from: location }} replace />;
  }

  if (requireAuth && user && requiredRole && !rolesLoading) {
    const hasRequiredRole = userRoles.some(ur => ur.role === requiredRole);
    
    logger.debug('[ProtectedRoute] Role check', { 
      requiredRole, 
      hasRequiredRole, 
      userRoles: userRoles.map(r => r.role),
      path: location.pathname 
    });
    
    if (!hasRequiredRole) {
      const roleRoutes: Record<string, string> = {
        'client': '/auth',
        'driver': '/driver/auth',
        'partner': '/partner/auth',
        'admin': '/operatorx/admin/auth'
      };
      
      return <Navigate to={roleRoutes[requiredRole] || '/auth'} replace />;
    }
    
    if (userRoles.length === 1) {
      if (!hasSelectedRole()) {
        setSelectedRole(requiredRole);
      }
    } else if (!hasSelectedRole() || selectedRole !== requiredRole) {
      setSelectedRole(requiredRole);
    }
  }

  // Redirection vers /role-selection uniquement si multi-rôle, aucun rôle auto-sélectionnable, et useEffect n'a pas pu résoudre
  if (user && !rolesLoading && userRoles.length > 1 && !hasSelectedRole() && location.pathname !== '/role-selection') {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
