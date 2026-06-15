import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability, FlexibleUpdateInstallStatus } from '@capawesome/capacitor-app-update';
import type { FlexibleUpdateState } from '@capawesome/capacitor-app-update';
import { logger } from '@/utils/logger';

export interface MobileUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  availableVersion?: string;
  immediateUpdateAllowed: boolean;
  flexibleUpdateAllowed: boolean;
  platform: 'ios' | 'android' | 'web';
}

export interface UpdateProgress {
  progress: number;
  bytesDownloaded: number;
  totalBytes: number;
}

type ProgressCallback = (progress: UpdateProgress) => void;
type DownloadCompleteCallback = () => void;

class MobileUpdateService {
  private isNative = Capacitor.isNativePlatform();
  private platform = Capacitor.getPlatform();
  
  // Listeners pour le flexible update
  private downloadListener: { remove: () => Promise<void> } | null = null;
  private onProgressCallback: ProgressCallback | null = null;
  private onDownloadCompleteCallback: DownloadCompleteCallback | null = null;

  async checkForUpdate(): Promise<MobileUpdateInfo> {
    if (!this.isNative) {
      return {
        updateAvailable: false,
        currentVersion: '1.0.0',
        immediateUpdateAllowed: false,
        flexibleUpdateAllowed: false,
        platform: 'web'
      };
    }

    try {
      const result = await AppUpdate.getAppUpdateInfo();
      
      return {
        updateAvailable: result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE,
        currentVersion: result.currentVersionCode?.toString() || '1.0.0',
        availableVersion: result.availableVersionCode?.toString(),
        immediateUpdateAllowed: result.immediateUpdateAllowed ?? false,
        flexibleUpdateAllowed: result.flexibleUpdateAllowed ?? false,
        platform: this.platform as 'ios' | 'android'
      };
    } catch (error) {
      logger.error('Mobile update check failed', error);
      return {
        updateAvailable: false,
        currentVersion: '1.0.0',
        immediateUpdateAllowed: false,
        flexibleUpdateAllowed: false,
        platform: this.platform as 'ios' | 'android'
      };
    }
  }

  async performImmediateUpdate(): Promise<void> {
    if (!this.isNative) {
      logger.warn('Immediate update not available on web');
      return;
    }

    try {
      await AppUpdate.performImmediateUpdate();
      logger.info('Immediate update started');
    } catch (error) {
      logger.error('Immediate update failed', error);
      throw error;
    }
  }

  async startFlexibleUpdate(): Promise<void> {
    if (!this.isNative) {
      logger.warn('Flexible update not available on web');
      return;
    }

    try {
      await AppUpdate.startFlexibleUpdate();
      logger.info('Flexible update started');
    } catch (error) {
      logger.error('Flexible update failed', error);
      throw error;
    }
  }

  /**
   * Démarrer le flexible update avec suivi de progression
   * Configure les listeners AVANT de démarrer le téléchargement
   */
  async startFlexibleUpdateWithTracking(): Promise<void> {
    if (!this.isNative) {
      logger.warn('Flexible update with tracking not available on web');
      return;
    }

    try {
      // 1. Configurer le listener AVANT de démarrer
      this.downloadListener = await AppUpdate.addListener(
        'onFlexibleUpdateStateChange',
        (state: FlexibleUpdateState) => this.handleUpdateStateChange(state)
      );
      logger.info('Flexible update listener configured');

      // 2. Démarrer le téléchargement (popup Google Play native)
      await AppUpdate.startFlexibleUpdate();
      logger.info('Flexible update with tracking started');
    } catch (error) {
      logger.error('Flexible update with tracking failed', error);
      // Cleanup listener en cas d'erreur
      await this.downloadListener?.remove();
      this.downloadListener = null;
      throw error;
    }
  }

  /**
   * Gérer les changements d'état du téléchargement
   */
  private handleUpdateStateChange(state: FlexibleUpdateState): void {
    const { installStatus, bytesDownloaded, totalBytesToDownload } = state;

    logger.debug('Flexible update state change', { installStatus, bytesDownloaded, totalBytesToDownload });

    // Progression du téléchargement
    if (installStatus === FlexibleUpdateInstallStatus.DOWNLOADING) {
      const progress = totalBytesToDownload > 0 
        ? (bytesDownloaded / totalBytesToDownload) * 100 
        : 0;
      
      this.onProgressCallback?.({
        progress,
        bytesDownloaded,
        totalBytes: totalBytesToDownload
      });
    }

    // Téléchargement terminé
    if (installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
      logger.info('Flexible update downloaded, ready to install');
      this.onDownloadCompleteCallback?.();
    }

    // Gestion des autres états
    if (installStatus === FlexibleUpdateInstallStatus.FAILED) {
      logger.error('Flexible update download failed');
    }

    if (installStatus === FlexibleUpdateInstallStatus.CANCELED) {
      logger.warn('Flexible update canceled by user');
    }

    if (installStatus === FlexibleUpdateInstallStatus.INSTALLED) {
      logger.info('Flexible update installed successfully');
    }
  }

  /**
   * Enregistrer un callback pour la progression
   */
  onProgress(callback: ProgressCallback): void {
    this.onProgressCallback = callback;
  }

  /**
   * Enregistrer un callback pour la fin du téléchargement
   */
  onDownloadComplete(callback: DownloadCompleteCallback): void {
    this.onDownloadCompleteCallback = callback;
  }

  /**
   * Nettoyer les listeners
   */
  async removeListeners(): Promise<void> {
    await this.downloadListener?.remove();
    this.downloadListener = null;
    this.onProgressCallback = null;
    this.onDownloadCompleteCallback = null;
    logger.debug('Mobile update listeners removed');
  }

  async completeFlexibleUpdate(): Promise<void> {
    if (!this.isNative) return;

    try {
      await AppUpdate.completeFlexibleUpdate();
      logger.info('Flexible update completed');
    } catch (error) {
      logger.error('Complete flexible update failed', error);
      throw error;
    }
  }

  openAppStore(): void {
    try {
      if (this.platform === 'ios') {
        // Ouvrir l'App Store iOS - TODO: Remplacer par l'ID réel quand publié
        const iosUrl = 'https://apps.apple.com/ci/app/kwenda-taxi/id6759842295';
        window.open(iosUrl, '_system') || window.open(iosUrl, '_blank');
      } else if (this.platform === 'android') {
        // Ouvrir Google Play Store - Essayer d'abord le lien market:// puis fallback
        const appId = 'cd.kwenda.app';
        const marketUrl = `market://details?id=${appId}`;
        const playStoreUrl = `https://play.google.com/store/apps/details?id=${appId}`;
        
        // Tenter d'ouvrir l'app Google Play directement
        const opened = window.open(marketUrl, '_system');
        if (!opened) {
          // Fallback vers URL web si l'app Play Store n'ouvre pas
          window.open(playStoreUrl, '_blank');
        }
      }
      logger.info(`App store opened for platform: ${this.platform}`);
    } catch (error) {
      logger.error('Failed to open app store', error);
      // Fallback final vers URL web
      if (this.platform === 'android') {
        window.open('https://play.google.com/store/apps/details?id=cd.kwenda.app', '_blank');
      }
    }
  }

  isNativePlatform(): boolean {
    return this.isNative;
  }

  getPlatform(): string {
    return this.platform;
  }
}

export const mobileUpdateService = new MobileUpdateService();
