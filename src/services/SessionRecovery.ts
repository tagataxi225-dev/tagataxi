/**
 * 💾 SESSION RECOVERY - LAYER 3: SAUVEGARDE ET RESTAURATION AUTOMATIQUE
 * Persiste l'état utilisateur pour recovery après crash/reload
 * Optimisé : auto-save toutes les 120s (au lieu de 30s)
 */

export interface SessionBackup {
  user: any;
  activeBooking: any;
  cartItems: any[];
  formData: Record<string, any>;
  lastRoute: string;
  timestamp: number;
  appState: Record<string, any>;
}

export class SessionRecovery {
  private backupInterval: NodeJS.Timeout | null = null;
  private autoSaveEnabled = true;
  private readonly BACKUP_KEY = 'kwenda_session_backup';
  private readonly MAX_AGE = 300000; // 5 minutes

  constructor() {
    this.startAutoSave();
  }

  private startAutoSave() {
    // Auto-save toutes les 120s — suffisant pour recovery
    this.backupInterval = setInterval(() => {
      if (this.autoSaveEnabled) this.saveCurrentState();
    }, 120000);

    window.addEventListener('beforeunload', () => this.saveCurrentState());
  }

  public saveCurrentState() {
    try {
      const backup: SessionBackup = {
        user: this.getSafe('kwenda_user_cache'),
        activeBooking: this.getSafe('kwenda_active_booking'),
        cartItems: this.getSafe('kwenda_cart') || [],
        formData: this.getFormData(),
        lastRoute: window.location.pathname,
        timestamp: Date.now(),
        appState: {
          theme: localStorage.getItem('kwenda_theme'),
          language: localStorage.getItem('kwenda_language'),
          lastCity: localStorage.getItem('kwenda_last_city'),
          preferences: localStorage.getItem('kwenda_user_preferences')
        }
      };
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
    } catch {}
  }

  private getSafe(key: string): any {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  }

  private getFormData(): Record<string, any> {
    try {
      const forms: Record<string, any> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('form_')) {
          const value = sessionStorage.getItem(key);
          if (value) forms[key] = JSON.parse(value);
        }
      }
      return forms;
    } catch { return {}; }
  }

  public getBackup(): SessionBackup | null {
    try {
      const backupStr = localStorage.getItem(this.BACKUP_KEY);
      if (!backupStr) return null;
      const backup: SessionBackup = JSON.parse(backupStr);
      if (Date.now() - backup.timestamp > this.MAX_AGE) {
        this.clearBackup();
        return null;
      }
      return backup;
    } catch { return null; }
  }

  public async restoreSession(): Promise<boolean> {
    const backup = this.getBackup();
    if (!backup) return false;

    try {
      if (backup.user) localStorage.setItem('kwenda_user_cache', JSON.stringify(backup.user));
      if (backup.activeBooking) localStorage.setItem('kwenda_active_booking', JSON.stringify(backup.activeBooking));
      if (backup.cartItems?.length) localStorage.setItem('kwenda_cart', JSON.stringify(backup.cartItems));
      Object.entries(backup.formData).forEach(([key, value]) => sessionStorage.setItem(key, JSON.stringify(value)));
      if (backup.appState.theme) localStorage.setItem('kwenda_theme', backup.appState.theme);
      if (backup.appState.language) localStorage.setItem('kwenda_language', backup.appState.language);

      if (backup.lastRoute && backup.lastRoute !== '/' && backup.lastRoute !== window.location.pathname) {
        window.history.replaceState(null, '', backup.lastRoute);
      }

      this.clearBackup();
      return true;
    } catch { return false; }
  }

  public clearBackup() { localStorage.removeItem(this.BACKUP_KEY); }
  public disableAutoSave() { this.autoSaveEnabled = false; }
  public enableAutoSave() { this.autoSaveEnabled = true; }
  public cleanup() { if (this.backupInterval) clearInterval(this.backupInterval); }
}

export const sessionRecovery = new SessionRecovery();
