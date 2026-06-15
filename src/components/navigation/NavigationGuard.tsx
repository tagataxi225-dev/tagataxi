import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppReady } from '@/contexts/AppReadyContext';
import { getDashboardPathFromStorage } from '@/hooks/useProtectedNavigation';

/**
 * 🛡️ MIDDLEWARE DE NAVIGATION GLOBAL
 * Intercepte TOUTES les navigations pour empêcher:
 * 1. Les utilisateurs connectés d'accéder aux routes publiques/auth
 * 2. La navigation croisée entre espaces de rôles différents
 */

// Mapping des préfixes de routes par rôle
const ROLE_ROUTE_PREFIXES: Record<string, string[]> = {
  client: ['/app/client', '/client', '/transport', '/delivery', '/food', '/marketplace', '/rental', '/vendeur', '/mes-adresses', '/referral', '/promos'],
  partner: ['/app/partenaire', '/partenaire', '/partner/dashboard', '/partner/rental', '/partner/profile', '/partner/settings', '/partner/pending-approval'],
  driver: ['/app/chauffeur', '/chauffeur', '/driver/find-partner'],
  admin: ['/operatorx/admin'],
};

// Routes de dashboard par rôle
const ROLE_DASHBOARDS: Record<string, string> = {
  client: '/app/client',
  partner: '/app/partenaire',
  driver: '/app/chauffeur',
  admin: '/operatorx/admin',
};

// 🛡️ TOUTES les routes publiques et d'authentification interdites aux utilisateurs connectés
const PUBLIC_AND_AUTH_ROUTES = [
  '/',
  '/landing',
  '/auth',
  '/app/auth',
  '/app/register',
  '/driver/auth',
  '/partner/auth',
  '/restaurant/auth',
  '/operatorx/admin/auth',
];

/**
 * Détermine quel rôle "possède" une route donnée
 */
const getRouteRole = (path: string): string | null => {
  for (const [role, prefixes] of Object.entries(ROLE_ROUTE_PREFIXES)) {
    if (prefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'))) {
      return role;
    }
  }
  return null;
};

/**
 * Vérifie si un chemin correspond à une route publique/auth
 */
const isPublicOrAuthRoute = (path: string): boolean => {
  return PUBLIC_AND_AUTH_ROUTES.some(route => path === route || path.startsWith(route + '/'));
};

export const NavigationGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, sessionReady } = useAppReady();
  const location = useLocation();
  const navigate = useNavigate();
  const lastRedirectRef = useRef<{ path: string; time: number } | null>(null);

  // Routes de callback/redirection à ignorer
  const IGNORED_ROUTES = ['/payment-confirmation', '/client/verify-email', '/campaign', '/reset-password'];

  useEffect(() => {
    if (!sessionReady) return;

    // 🛡️ Si déconnexion en cours, ne rien bloquer
    if (localStorage.getItem('kwenda_signing_out')) {
      localStorage.removeItem('kwenda_signing_out');
      return;
    }

    const currentPath = location.pathname;

    // Ignorer certaines routes spéciales
    if (IGNORED_ROUTES.some(route => currentPath.startsWith(route))) {
      return;
    }

    // Si l'utilisateur est connecté
    if (user) {
      // 1. Rediriger depuis TOUTES les routes publiques et auth
      const isLoginInProgress = localStorage.getItem('kwenda_login_in_progress') === 'true';
      if (!isLoginInProgress && isPublicOrAuthRoute(currentPath)) {
        const dashboardPath = getDashboardPathFromStorage();
        const now = Date.now();
        if (lastRedirectRef.current &&
            lastRedirectRef.current.path === dashboardPath &&
            now - lastRedirectRef.current.time < 500) {
          return; // Anti-rebond
        }
        lastRedirectRef.current = { path: dashboardPath, time: now };
        navigate(dashboardPath, { replace: true });
        return;
      }

      // 2. Bloquer la navigation croisée entre rôles
      const selectedRole = localStorage.getItem('kwenda_selected_role');
      if (selectedRole) {
        const routeRole = getRouteRole(currentPath);
        
        // Si la route appartient à un rôle différent du rôle sélectionné
        if (routeRole && routeRole !== selectedRole) {
          const correctDashboard = ROLE_DASHBOARDS[selectedRole] || '/app/client';
          const now = Date.now();
          if (lastRedirectRef.current &&
              lastRedirectRef.current.path === correctDashboard &&
              now - lastRedirectRef.current.time < 500) {
            return;
          }
          lastRedirectRef.current = { path: correctDashboard, time: now };
          navigate(correctDashboard, { replace: true });
        }
      }
    }
  }, [user, sessionReady, location.pathname, navigate]);

  return <>{children}</>;
};
