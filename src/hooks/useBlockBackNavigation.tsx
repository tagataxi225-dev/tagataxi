import { useEffect, useRef } from 'react';
import { useAppReady } from '@/contexts/AppReadyContext';

/**
 * 🛡️ HOOK DE BLOCAGE NAVIGATION RETOUR (SIMPLIFIÉ)
 * 
 * ⚠️ IMPORTANT: Ce hook est désormais minimal pour ne pas interférer
 * avec useNativeNavigation qui gère le swipe back sur Android/iOS.
 * 
 * La logique de blocage des routes publiques est centralisée dans useNativeNavigation.
 */
export const useBlockBackNavigation = (shouldBlock: boolean = true) => {
  const { user } = useAppReady();
  const initializedRef = useRef(false);

  useEffect(() => {
    // Ne rien faire si pas d'utilisateur ou déjà initialisé
    if (!shouldBlock || !user || initializedRef.current) return;
    
    // Marquer comme initialisé (une seule fois par session)
    initializedRef.current = true;
    
    // ✅ Simplement s'assurer qu'on a une entrée dans l'historique
    // Le reste est géré par useNativeNavigation
    if (window.history.state?.protected !== true) {
      window.history.replaceState(
        { protected: true },
        '',
        window.location.pathname
      );
    }
  }, [shouldBlock, user]);
};

/**
 * Hook simplifié pour les pages authentifiées
 * Utiliser dans les layouts/containers des espaces protégés
 */
export const useAuthenticatedNavigation = () => {
  const { user } = useAppReady();
  
  // Activer le blocage uniquement si l'utilisateur est connecté
  useBlockBackNavigation(!!user);
  
  return { isBlocking: !!user };
};
