import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/appConfig';

let cachedKey: string | null = null;

class GoogleMapsLoaderService {
  private static instance: GoogleMapsLoaderService;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;
  private apiKey: string | null = null;
  private mapId: string | null = null;
  // sessionStorage key — survit aux rechargements de page dans le même onglet
  private readonly SESSION_KEY = 'kwenda_maps_k';
  // Circuit breaker : après MAX_MAPS_FAILURES échecs, on arrête définitivement.
  // Évite une boucle infinie preload() → error → retry → preload().
  private failCount = 0;
  private readonly MAX_LOAD_FAILURES = APP_CONFIG.MAX_MAPS_FAILURES;
  private failedPermanently = false;

  private constructor() {}

  static getInstance(): GoogleMapsLoaderService {
    if (!GoogleMapsLoaderService.instance) {
      GoogleMapsLoaderService.instance = new GoogleMapsLoaderService();
    }
    return GoogleMapsLoaderService.instance;
  }

  async getApiKey(): Promise<string> {
    if (cachedKey) return cachedKey;
    if (this.apiKey) return this.apiKey;

    // Chemin 0 — sessionStorage (évite l'appel réseau à l'edge function à chaque rechargement)
    // La clé est cachée dans sessionStorage pour la durée de l'onglet.
    try {
      const stored = sessionStorage.getItem(this.SESSION_KEY);
      if (stored) {
        if (stored.startsWith('AIza')) {
          this.apiKey = stored;
          cachedKey = stored;
          console.log('✅ [MAPS_LOADER] API key from sessionStorage (no network call)');
          return stored;
        }
        try { sessionStorage.removeItem(this.SESSION_KEY); } catch {}
      }
    } catch { /* sessionStorage peut être bloqué en mode privé strict */ }

    // Chemin 1 — edge function Supabase (clé protégée côté serveur)
    try {
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      if (error) throw error;
      if (!data?.apiKey) throw new Error('No API key returned');

      this.apiKey = data.apiKey as string;
      this.mapId = data.mapId && !String(data.mapId).startsWith('AIza') ? data.mapId : null;
      cachedKey = this.apiKey;
      try { sessionStorage.setItem(this.SESSION_KEY, this.apiKey); } catch { /* ignore */ }
      return this.apiKey;
    } catch (edgeFnError) {
      console.warn('⚠️ [MAPS_LOADER] Edge function failed, trying env var fallback:', edgeFnError);
    }

    // Chemin 2 — variable d'environnement côté client (fallback)
    // Ajouter VITE_GOOGLE_MAPS_API_KEY dans .env si l'edge function est indisponible.
    // Les clés Maps sont restreintes par domaine/referrer dans Google Cloud Console —
    // les exposer côté client est acceptable dans ce contexte.
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (envKey) {
      console.log('✅ [MAPS_LOADER] Using VITE_GOOGLE_MAPS_API_KEY fallback');
      this.apiKey = envKey;
      cachedKey = envKey;
      try { sessionStorage.setItem(this.SESSION_KEY, envKey); } catch { /* ignore */ }
      return envKey;
    }

    // Chemin 3 — clé centrale (src/config/appConfig.ts → APP_CONFIG.GOOGLE_MAPS_API_KEY)
    // Restreinte par HTTP Referrer dans Google Cloud Console — safe côté client.
    const fallbackKey = APP_CONFIG.GOOGLE_MAPS_API_KEY;
    console.log('✅ [MAPS_LOADER] Using APP_CONFIG fallback key');
    this.apiKey = fallbackKey;
    cachedKey = fallbackKey;
    try { sessionStorage.setItem(this.SESSION_KEY, fallbackKey); } catch { /* ignore */ }
    return fallbackKey;
  }

  getMapId(): string | null {
    return this.mapId;
  }

  async load(libraries: string[] = ['places', 'marker', 'geometry']): Promise<void> {
    if (this.isLoaded) return;
    // Circuit breaker : ne plus tenter de charger après MAX_LOAD_FAILURES échecs
    if (this.failedPermanently) throw new Error('Google Maps permanently failed — max retries reached');
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.loadScript(libraries);
    return this.loadPromise;
  }

  private async loadScript(libraries: string[]): Promise<void> {
    try {
      if (window.google?.maps?.Map) {
        this.isLoaded = true;
        return;
      }

      const apiKey = await this.getApiKey();

      // ✅ `await` ici est intentionnel et CRITIQUE.
      // Sans await, si script.onerror fire → la Promise interne rejette
      // mais le catch block ci-dessous n'est PAS atteint (return != await).
      // Résultat sans await : this.loadPromise reste une Promise rejetée,
      // load() retourne la même Promise rejetée à chaque appel, le script
      // n'est plus jamais réinjecté → "aucune requête réseau vers Google Maps".
      await new Promise<void>((resolve, reject) => {
        const callbackName = '__gmapsInit_' + Math.floor(Math.random() * 1000000);
        (window as any)[callbackName] = () => {
          this.isLoaded = true;
          delete (window as any)[callbackName];
          resolve();
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        script.onerror = (e) => {
          console.error('❌ [MAPS_LOADER] Script load error:', e);
          reject(new Error('Failed to load Google Maps script'));
        };
        document.head.appendChild(script);
        console.log('📡 [MAPS_LOADER] Script injected:', script.src.replace(apiKey, 'KEY_HIDDEN'));

        setTimeout(() => reject(new Error('Google Maps script timeout (12s)')), 12000);
      });
    } catch (error) {
      // Ce catch est maintenant atteint dans TOUS les cas d'erreur :
      // - getApiKey() échoue
      // - script.onerror (grâce à await)
      // - timeout (grâce à await)
      try { sessionStorage.removeItem(this.SESSION_KEY); } catch {}
      this.loadPromise = null; // permet un retry propre via load()
      this.failCount += 1;
      if (this.failCount >= this.MAX_LOAD_FAILURES) {
        this.failedPermanently = true;
        console.error(`❌ [MAPS_LOADER] ${this.MAX_LOAD_FAILURES} échecs consécutifs → circuit ouvert, plus de retry`);
      } else {
        // Backoff exponentiel : 1s, 2s, 4s avant le prochain retry autorisé
        const delay = 1000 * 2 ** (this.failCount - 1);
        console.warn(`⚠️ [MAPS_LOADER] Échec ${this.failCount}/${this.MAX_LOAD_FAILURES} — retry dans ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
      throw error;
    }
  }

  /** Précharge le SDK Maps dès que possible (fire-and-forget).
   *  Appeler au moment où l'utilisateur arrive sur /transport pour gagner
   *  les ~400ms du délai uiReady avant que OptimizedMapView monte.
   *  La promesse est mémoïsée — appels redondants sont sans effet. */
  preload(): void {
    this.load(['places', 'marker', 'geometry']).catch(() => {});
  }

  reset(): void {
    this.loadPromise = null;
    this.isLoaded = false;
    this.apiKey = null;
    this.mapId = null;
    this.failCount = 0;
    this.failedPermanently = false;
    cachedKey = null; // force re-fetch de la clé au prochain load
    document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach(s => s.remove());
  }
}

export const googleMapsLoader = GoogleMapsLoaderService.getInstance();
