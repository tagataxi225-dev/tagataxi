import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseLazyGoogleMapsOptions {
  /**
   * Si true, Google Maps sera chargé immédiatement.
   * Si false, vous devez appeler loadMaps() manuellement.
   */
  autoLoad?: boolean;
  /**
   * Librairies Google Maps à charger (ex: ['places', 'geometry'])
   */
  libraries?: string[];
}

interface UseLazyGoogleMapsReturn {
  /** Indique si Google Maps est chargé */
  isLoaded: boolean;
  /** Indique si le chargement est en cours */
  isLoading: boolean;
  /** Erreur éventuelle lors du chargement */
  error: string | null;
  /** Fonction pour déclencher le chargement manuel */
  loadMaps: () => Promise<void>;
  /** Clé Google Maps récupérée */
  apiKey: string | null;
}

let googleMapsPromise: Promise<void> | null = null;
let isGoogleMapsLoaded = false;

/**
 * Hook pour charger Google Maps de manière lazy (à la demande)
 * Améliore les performances en évitant de charger Google Maps sur toutes les pages
 * 
 * @example
 * // Chargement automatique
 * const { isLoaded, apiKey } = useLazyGoogleMaps({ autoLoad: true });
 * 
 * @example
 * // Chargement manuel (recommandé)
 * const { isLoaded, loadMaps } = useLazyGoogleMaps({ autoLoad: false });
 * useEffect(() => {
 *   if (needsMap) {
 *     loadMaps();
 *   }
 * }, [needsMap, loadMaps]);
 */
export const useLazyGoogleMaps = (options: UseLazyGoogleMapsOptions = {}): UseLazyGoogleMapsReturn => {
  const { autoLoad = false, libraries = ['places', 'geometry'] } = options;
  
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(isGoogleMapsLoaded);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer la clé API Google Maps
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-google-maps-key');
        if (error) throw error;
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        }
      } catch (err: any) {
        console.error('Erreur récupération clé Google Maps:', err);
        setError(err.message);
      }
    };

    if (!apiKey) {
      fetchApiKey();
    }
  }, [apiKey]);

  const loadMaps = useCallback(async () => {
    // Si déjà chargé, ne rien faire
    if (isGoogleMapsLoaded) {
      setIsLoaded(true);
      return;
    }

    // Si chargement en cours, attendre
    if (googleMapsPromise) {
      setIsLoading(true);
      try {
        await googleMapsPromise;
        setIsLoaded(true);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
      return;
    }

    // Vérifier qu'on a la clé API
    if (!apiKey) {
      setError('Clé API Google Maps non disponible');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Créer la promesse de chargement
    googleMapsPromise = new Promise<void>((resolve, reject) => {
      // Vérifier si le script existe déjà
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        isGoogleMapsLoaded = true;
        setIsLoaded(true);
        setIsLoading(false);
        resolve();
        return;
      }

      // Créer le callback global
      const callbackName = 'initGoogleMaps';
      (window as any)[callbackName] = () => {
        isGoogleMapsLoaded = true;
        setIsLoaded(true);
        setIsLoading(false);
        delete (window as any)[callbackName];
        resolve();
      };

      // Créer le script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        const errorMsg = 'Erreur lors du chargement de Google Maps';
        setError(errorMsg);
        setIsLoading(false);
        delete (window as any)[callbackName];
        googleMapsPromise = null;
        reject(new Error(errorMsg));
      };

      document.head.appendChild(script);
    });

    try {
      await googleMapsPromise;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [apiKey, libraries]);

  // Chargement automatique si demandé
  useEffect(() => {
    if (autoLoad && apiKey && !isGoogleMapsLoaded) {
      loadMaps();
    }
  }, [autoLoad, apiKey, loadMaps]);

  return {
    isLoaded,
    isLoading,
    error,
    loadMaps,
    apiKey,
  };
};
