import { Navigate } from 'react-router-dom';
import { useAppReady } from '@/contexts/AppReadyContext';
import { InvisibleLoadingBar } from '@/components/loading/InvisibleLoadingBar';

/**
 * 🚀 COMPOSANT SMART HOME OPTIMISÉ
 * Utilise le contexte AppReady pour éviter les vérifications redondantes
 * Transition invisible avec barre de 2px
 */
export const SmartHome = () => {
  const { user, sessionReady, userRole, contentReady } = useAppReady();

  // Attendre que tout soit prêt (transition invisible)
  if (!sessionReady || !contentReady) {
    return <InvisibleLoadingBar />;
  }

  // NON CONNECTÉ : rediriger vers /auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ✅ CONNECTÉ : Redirection simple selon userRole
  const redirectPath = userRole === 'admin' ? '/operatorx/admin'
    : userRole === 'partner' ? '/app/partenaire'
    : userRole === 'driver' ? '/app/chauffeur'
    : userRole === 'restaurant' ? '/app/restaurant'
    : '/app/client';
  
  console.log('🚀 [SmartHome] Redirecting user', {
    userRole,
    redirectPath,
    userId: user.id
  });
  
  return <Navigate to={redirectPath} replace />;
};
