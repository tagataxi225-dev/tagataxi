
/* Global typings for legacy window.supabase usage */
export {};

declare global {
  // Variables injectées par Vite au build
  const __APP_VERSION__: string;
  const __BUILD_DATE__: string;

  interface Window {
    supabase: any;
    kwenda?: {
      version: string;
      buildDate: string;
      clearAllCaches: () => Promise<void>;
      checkUpdate: () => Promise<void>;
      forceReload: () => void;
      showCacheInfo: () => Promise<void>;
    };
  }
}
