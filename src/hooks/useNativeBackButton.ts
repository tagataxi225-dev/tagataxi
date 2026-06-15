import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 🔙 HOOK DE GESTION DU BOUTON RETOUR NATIF
 * Empêche l'application de se fermer quand on glisse/appuie sur retour
 * Navigue correctement dans l'historique de l'app
 * 
 * FIX: Utilise canGoBack de Capacitor au lieu de window.history.length
 */
export const useNativeBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    const setupBackHandler = async () => {
      try {
        // Import dynamique de Capacitor
        const { Capacitor } = await import('@capacitor/core');
        
        // Seulement sur les plateformes natives (Android/iOS)
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');
        
        // 🔧 FIX: Nettoyer l'ancien listener avant d'en créer un nouveau
        if (listenerRef.current) {
          await listenerRef.current.remove();
          listenerRef.current = null;
        }
        
        if (!isMounted) return;
        
        listenerRef.current = await App.addListener('backButton', ({ canGoBack }) => {
          // Pages principales (dashboards) - demander confirmation pour quitter
          const mainPages = [
            '/app/client',
            '/app/driver', 
            '/app/partner',
            '/app/admin',
            '/app/restaurant'
          ];
          
          const currentPath = location.pathname;
          const isOnMainPage = mainPages.some(page => 
            currentPath === page || currentPath === page + '/'
          );
          
          if (isOnMainPage) {
            // Sur la page d'accueil du rôle, demander confirmation pour quitter
            if (window.confirm('Voulez-vous quitter l\'application ?')) {
              App.exitApp();
            }
          } else if (canGoBack) {
            // 🔧 FIX: Utiliser canGoBack de Capacitor (plus fiable)
            navigate(-1);
          } else {
            // Fallback: retour au dashboard client (sans replace pour préserver l'historique)
            navigate('/app/client');
          }
        });

      } catch (error) {
        // Silently fail on web - Capacitor plugins not available
        console.debug('[BackButton] Not on native platform');
      }
    };
    
    setupBackHandler();
    
    return () => {
      isMounted = false;
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, [navigate, location.pathname]);
};
