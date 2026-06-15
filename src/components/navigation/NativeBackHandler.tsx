import { useNativeNavigation } from '@/hooks/useNativeNavigation';

/**
 * 🔙 Composant invisible qui gère le bouton retour natif Android/iOS
 * 
 * Fonctionnalités :
 * - Bouton retour Android : navigation dans l'historique
 * - Swipe iOS : navigation fluide sans sortir de l'app
 * - Double-back pour quitter sur les dashboards principaux
 * - Protection contre retour vers routes publiques si connecté
 * 
 * Doit être placé DANS le BrowserRouter pour avoir accès à useNavigate
 */
export const NativeBackHandler = () => {
  useNativeNavigation();
  return null;
};
