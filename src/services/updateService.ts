import { UpdateInfo } from '@/types/update';
import { logger } from '@/utils/logger';

class UpdateService {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallbacks: Array<(info: UpdateInfo) => void> = [];
  private updateInfo: UpdateInfo | null = null;

  async initialize() {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      this.setupListeners();
      logger.info('UpdateService initialized');
    } catch (error) {
      logger.error('UpdateService init failed', error);
    }
  }

  private setupListeners() {
    if (!this.registration) return;

    // Détecter les nouvelles versions
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nouvelle version disponible
          this.getVersionInfo().then((info) => {
            this.updateInfo = info;
            this.notifyUpdateAvailable(info);
          });
        }
      });
    });

    // Écouter les messages du SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
        this.updateInfo = event.data.info;
        this.notifyUpdateAvailable(event.data.info);
      }
    });
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    // Skip in dev/preview where sw.js doesn't exist (returns HTML)
    if (import.meta.env.DEV) return false;

    try {
      await this.registration.update();
      logger.info('Update check completed');
      return true;
    } catch (error) {
      // Expected in environments without a real service worker
      console.warn('ServiceWorker update check skipped:', (error as Error)?.message);
      return false;
    }
  }

  // Vérification intelligente multi-trigger
  enableSmartChecking() {
    // 1. Vérifier au focus de la fenêtre
    window.addEventListener('focus', () => {
      const lastCheck = localStorage.getItem('kwenda_last_update_check');
      const now = Date.now();
      if (!lastCheck || now - parseInt(lastCheck) > 5 * 60 * 1000) { // 5 minutes
        this.checkForUpdates();
        localStorage.setItem('kwenda_last_update_check', now.toString());
      }
    });

    // 2. Vérifier après inactivité
    let inactivityTimer: NodeJS.Timeout;
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.checkForUpdates();
      }, 5 * 60 * 1000); // 5 minutes
    };
    
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // 3. Vérification périodique (30 minutes)
    setInterval(() => {
      this.checkForUpdates();
    }, 30 * 60 * 1000);
  }

  async getVersionInfo(): Promise<UpdateInfo> {
    if (!navigator.serviceWorker.controller) {
      return { version: '1.0.0' };
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data || { version: '1.0.0' });
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );

      // Timeout après 2 secondes
      setTimeout(() => resolve({ version: '1.0.0' }), 2000);
    });
  }

  async installUpdate(): Promise<void> {
    if (!this.registration?.waiting) {
      logger.warn('No update waiting');
      return;
    }

    // Dire au SW en attente de prendre le contrôle
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Attendre que le nouveau SW prenne le contrôle
    return new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve();
      });
    });
  }

  onUpdateAvailable(callback: (info: UpdateInfo) => void) {
    this.updateCallbacks.push(callback);
    
    // Si une mise à jour est déjà disponible, notifier immédiatement
    if (this.updateInfo) {
      callback(this.updateInfo);
    }
  }

  private notifyUpdateAvailable(info: UpdateInfo) {
    logger.info('Update available', info);
    this.updateCallbacks.forEach(callback => callback(info));
  }

  skipUpdate(durationMs: number) {
    const config = {
      dismissed_at: new Date().toISOString(),
      dismiss_count: this.getDismissCount() + 1,
      current_version: this.updateInfo?.version || 'unknown',
      skipped_versions: this.getSkippedVersions(),
      last_check: new Date().toISOString()
    };

    if (this.updateInfo?.version) {
      config.skipped_versions.push(this.updateInfo.version);
    }

    localStorage.setItem('kwenda_update_config', JSON.stringify(config));
    localStorage.setItem('kwenda_update_skip_until', (Date.now() + durationMs).toString());
  }

  shouldShowPrompt(): boolean {
    const skipUntil = localStorage.getItem('kwenda_update_skip_until');
    if (skipUntil && Date.now() < parseInt(skipUntil)) {
      return false;
    }
    return true;
  }

  private getDismissCount(): number {
    const config = localStorage.getItem('kwenda_update_config');
    if (!config) return 0;
    try {
      return JSON.parse(config).dismiss_count || 0;
    } catch {
      return 0;
    }
  }

  private getSkippedVersions(): string[] {
    const config = localStorage.getItem('kwenda_update_config');
    if (!config) return [];
    try {
      return JSON.parse(config).skipped_versions || [];
    } catch {
      return [];
    }
  }

  clearSkipConfig() {
    localStorage.removeItem('kwenda_update_skip_until');
  }
}

export const updateService = new UpdateService();
