/**
 * Service de mise à jour automatique
 * Détecte les nouvelles versions et force leur installation
 */

import { logger } from '@/utils/logger';
import { cacheWiper } from './CacheWiper';
import { toast } from '@/hooks/use-toast';

interface VersionInfo {
  version: string;
  buildDate: string;
  forceUpdate?: boolean;
  minVersion?: string;
}

class AutoUpdateService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;
  private isUpdating = false;
  private isPaused = false;
  private lastUpdateCheck: number = 0;
  private registration: ServiceWorkerRegistration | null = null;
  private readonly CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private readonly MIN_CHECK_INTERVAL = 60 * 1000; // Minimum 1 minute entre vérifications
  private readonly VERSION_CHECK_URL = '/version.json';

  /**
   * Initialise le service de mise à jour automatique
   */
  initialize(): void {
    logger.info('🚀 Initializing AutoUpdateService');

    // Obtenir la registration du Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        this.registration = reg;
        logger.info('Service Worker ready');
      });
    }

    // Vérification initiale après 2 MINUTES (laisser le temps de se connecter)
    setTimeout(() => this.checkAndInstallIfNeeded(), 2 * 60 * 1000);

    // Vérification au focus de la fenêtre
    window.addEventListener('focus', () => this.onWindowFocus());

    // Vérification au retour de visibilité
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());

    // Polling toutes les 30 minutes
    this.startPeriodicCheck();

    logger.info('✅ AutoUpdateService initialized');
  }

  /**
   * Démarre la vérification périodique
   */
  private startPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkAndInstallIfNeeded();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Gère le focus de la fenêtre
   */
  private onWindowFocus(): void {
    logger.info('Window focused, checking for updates');
    this.checkAndInstallIfNeeded();
  }

  /**
   * Gère le changement de visibilité
   */
  private onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      logger.info('App visible, checking for updates');
      this.checkAndInstallIfNeeded();
    }
  }

  /**
   * Vérifie et installe automatiquement si nouvelle version
   */
  async checkAndInstallIfNeeded(): Promise<void> {
    // Protection si en pause (pendant auth, paiement, etc.)
    if (this.isPaused) {
      logger.info('⏭️ Update check skipped (paused)');
      return;
    }

    // Protection anti-spam
    const now = Date.now();
    if (now - this.lastUpdateCheck < this.MIN_CHECK_INTERVAL) {
      logger.info('⏭️ Skipping update check (too soon)');
      return;
    }

    // Protection contre mise à jour en cours
    if (this.isUpdating) {
      logger.info('⏭️ Update already in progress');
      return;
    }

    if (this.isChecking) {
      logger.info('Update check already in progress');
      return;
    }

    try {
      this.isChecking = true;
      this.lastUpdateCheck = now;
      
      const hasNewVersion = await this.checkForNewVersion();

      if (hasNewVersion) {
        this.isUpdating = true;
        logger.info('🎉 New version detected, installing automatically');
        await this.installUpdateAutomatically();
      }
    } catch (error) {
      logger.error('Update check failed', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Vérifie s'il y a une nouvelle version
   */
  private async checkForNewVersion(): Promise<boolean> {
    try {
      // Fetch le fichier version.json avec cache-bust
      const response = await fetch(`${this.VERSION_CHECK_URL}?t=${Date.now()}`);
      
      if (!response.ok) {
        logger.warn('Failed to fetch version.json');
        return false;
      }

      const versionInfo: VersionInfo = await response.json();
      const currentVersion = this.getCurrentVersion();

      logger.info('Version check:', {
        current: currentVersion,
        latest: versionInfo.version,
        forceUpdate: versionInfo.forceUpdate
      });

      // Si les versions sont identiques, sauvegarder quand même
      if (versionInfo.version === currentVersion) {
        // Assurer que la version est sauvegardée
        localStorage.setItem('app_version', versionInfo.version);
        localStorage.setItem('app_version_last_check', Date.now().toString());
        return false;
      }

      // Vérifier si on a déjà essayé cette mise à jour
      const lastAttemptedVersion = localStorage.getItem('app_version_attempted');
      if (lastAttemptedVersion === versionInfo.version) {
        logger.warn('⚠️ Already attempted to update to', versionInfo.version);
        // Mettre à jour quand même la version actuelle pour éviter la boucle
        localStorage.setItem('app_version', versionInfo.version);
        return false;
      }

      // Nouvelle version détectée
      if (versionInfo.version !== currentVersion) {
        logger.info('🆕 New version available:', versionInfo.version);
        // Marquer cette version comme tentée
        localStorage.setItem('app_version_attempted', versionInfo.version);
        return true;
      }

      // Vérifier si mise à jour forcée
      if (versionInfo.forceUpdate) {
        logger.warn('🔴 Force update required');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Version check failed', error);
      return false;
    }
  }

  /**
   * Récupère la version actuelle de l'application
   */
  private getCurrentVersion(): string {
    // 1. Essayer depuis __APP_VERSION__ (injecté par Vite)
    try {
      if (typeof (globalThis as any).__APP_VERSION__ !== 'undefined') {
        const version = (globalThis as any).__APP_VERSION__;
        // Sauvegarder pour comparaisons futures
        localStorage.setItem('app_version', version);
        return version;
      }
    } catch {
      // Ignore
    }

    // 2. Lire depuis localStorage (version déjà installée)
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion) {
      return savedVersion;
    }

    // 3. Lire depuis version.json (première fois)
    return this.fetchCurrentVersionSync();
  }

  /**
   * Fetch la version courante de manière synchrone (première visite uniquement)
   */
  private fetchCurrentVersionSync(): string {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/version.json?t=' + Date.now(), false); // Synchrone
      xhr.send();
      
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        localStorage.setItem('app_version', data.version);
        return data.version;
      }
    } catch (error) {
      logger.warn('Failed to fetch version synchronously');
    }
    
    return '2.0.0'; // Fallback sur la version actuelle
  }

  /**
   * Installe automatiquement la mise à jour
   */
  async installUpdateAutomatically(): Promise<void> {
    try {
      // 1. Notification discrète (toast non-bloquant)
      toast({
        title: '🚀 Mise à jour en cours',
        description: 'Installation dans 3 secondes...',
        duration: 3000
      });

      logger.info('⏳ Waiting 2 seconds before update');
      
      // 2. Attendre 2 secondes (laisser finir les actions en cours)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Vider TOUS les caches
      logger.info('🗑️ Wiping all caches');
      await cacheWiper.wipeAllCaches();

      // 4. Activer le nouveau Service Worker
      if (this.registration?.waiting) {
        logger.info('📦 Activating new Service Worker');
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // 5. Attendre un peu pour que le SW soit activé
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 6. Recharger la page (hard reload)
      logger.info('🔄 Reloading application');
      window.location.reload();
    } catch (error) {
      logger.error('❌ Auto-update installation failed', error);
      
      // Fallback: recharger quand même
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  /**
   * Pause les vérifications de mise à jour (pendant auth, paiement, etc.)
   */
  pause(): void {
    this.isPaused = true;
    logger.info('⏸️ AutoUpdateService paused');
  }

  /**
   * Reprend les vérifications
   */
  resume(): void {
    this.isPaused = false;
    logger.info('▶️ AutoUpdateService resumed');
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const autoUpdateService = new AutoUpdateService();
