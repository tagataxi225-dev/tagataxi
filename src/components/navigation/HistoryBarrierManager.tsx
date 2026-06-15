import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppReady } from '@/contexts/AppReadyContext';

/**
 * 🛡️ GESTIONNAIRE DE BARRIÈRES D'HISTORIQUE
 * 
 * Ce composant invisible injecte et maintient des "barrières" dans l'historique
 * du navigateur pour empêcher la sortie accidentelle de l'app lors du swipe back.
 * 
 * Fonctionne sur :
 * - Android (Capacitor native)
 * - iOS (Capacitor native + PWA Safari)
 * - PWA installée (Chrome, Edge, etc.)
 * 
 * Architecture :
 * [Barrière 1] → [Barrière 2] → [Barrière 3] → [Page actuelle]
 * 
 * Quand l'utilisateur fait swipe back et atteint une barrière,
 * le hook useNativeNavigation intercepte et gère le comportement.
 */

// Nombre de barrières à maintenir
const MIN_BARRIERS = 2;

/**
 * Détecte si l'app tourne en mode standalone (PWA ou native)
 */
const isStandaloneMode = (): boolean => {
  // PWA standalone
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  
  // iOS Safari "Add to Home Screen"
  if ((window.navigator as any).standalone === true) return true;
  
  // On vérifiera Capacitor de manière asynchrone
  return false;
};

/**
 * Compte le nombre de barrières actuellement dans l'historique
 */
const countBarriersInHistory = (): number => {
  // On ne peut pas vraiment compter les entrées, mais on peut vérifier l'état actuel
  const state = window.history.state;
  return state?.barrier ? 1 : 0;
};

export const HistoryBarrierManager = () => {
  const location = useLocation();
  const { user, sessionReady } = useAppReady();
  const initializedRef = useRef(false);
  const lastPathRef = useRef(location.pathname);
  
  /**
   * Injection initiale des barrières
   * S'exécute une seule fois au montage quand l'utilisateur est connecté
   */
  useEffect(() => {
    if (!sessionReady || !user || initializedRef.current) return;
    
    const initBarriers = async () => {
      // Vérifier si on doit activer les barrières
      let shouldActivate = isStandaloneMode();
      
      // Vérifier aussi Capacitor
      if (!shouldActivate) {
        try {
          const { Capacitor } = await import('@capacitor/core');
          shouldActivate = Capacitor.isNativePlatform();
        } catch {
          // Pas de Capacitor
        }
      }
      
      if (!shouldActivate) {
        console.debug('[HistoryBarrier] Not in standalone mode, skipping');
        return;
      }
      
      // Injecter les barrières initiales
      const currentPath = window.location.pathname;
      
      for (let i = 0; i < MIN_BARRIERS; i++) {
        window.history.pushState(
          { 
            barrier: true, 
            index: i, 
            managedBy: 'HistoryBarrierManager',
            timestamp: Date.now() 
          },
          '',
          currentPath
        );
      }
      
      initializedRef.current = true;
      console.log(`🛡️ [HistoryBarrier] ${MIN_BARRIERS} initial barriers injected`);
    };
    
    initBarriers();
  }, [sessionReady, user]);
  
  /**
   * Réinjection de barrière après chaque navigation
   * Garantit qu'il y a toujours des barrières entre l'utilisateur et la sortie
   */
  useEffect(() => {
    if (!initializedRef.current || !user) return;
    
    // Ignorer si c'est la même route (évite les boucles)
    if (location.pathname === lastPathRef.current) return;
    lastPathRef.current = location.pathname;
    
    // Petit délai pour laisser React Router terminer
    const timer = setTimeout(() => {
      const currentPath = window.location.pathname;
      
      // Vérifier si l'état actuel est déjà une barrière
      if (!window.history.state?.barrier) {
        window.history.pushState(
          { 
            barrier: true, 
            afterNavigation: true,
            managedBy: 'HistoryBarrierManager',
            timestamp: Date.now() 
          },
          '',
          currentPath
        );
        console.log('🛡️ [HistoryBarrier] Barrier reinforced after navigation');
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [location.pathname, user]);
  
  /**
   * Écouter les déconnexions pour réinitialiser
   */
  useEffect(() => {
    if (sessionReady && !user && initializedRef.current) {
      // L'utilisateur s'est déconnecté, reset le flag
      initializedRef.current = false;
      console.log('🔓 [HistoryBarrier] User logged out, barriers disabled');
    }
  }, [sessionReady, user]);
  
  // Composant invisible
  return null;
};
