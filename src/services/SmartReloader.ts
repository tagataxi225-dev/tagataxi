/**
 * 🔄 SMART RELOADER - SÉCURISÉ MOBILE
 * Reload UNIQUEMENT en dernier recours, JAMAIS automatique sur mobile natif
 */

export interface ReloadReason {
  type: 'crash' | 'memory' | 'update' | 'recovery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

/** Détecte si on est sur Capacitor natif */
const isNativeMobile = (): boolean => {
  try {
    return !!(window as any)?.Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

/** Vérifie si une session Supabase active existe */
const hasActiveSession = (): boolean => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.includes('auth-token')) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
};

export class SmartReloader {
  private reloadScheduled = false;
  private reloadTimeout: NodeJS.Timeout | null = null;

  public scheduleReload(reason: ReloadReason, delayMs: number = 3000) {
    // 🛡️ JAMAIS de reload auto sur mobile natif (sauf critical)
    if (isNativeMobile() && reason.severity !== 'critical') {
      console.log('🛡️ [SmartReloader] Reload BLOQUÉ sur mobile natif:', reason.message);
      return;
    }

    // 🛡️ Ne pas reloader si session active (risque de déconnexion)
    if (hasActiveSession() && reason.severity !== 'critical') {
      console.log('🛡️ [SmartReloader] Reload BLOQUÉ - session active:', reason.message);
      return;
    }

    if (this.reloadScheduled) return;
    this.reloadScheduled = true;
    
    console.log(`🔄 [SmartReloader] Reload planifié: ${reason.message} (${delayMs}ms)`);
    this.saveStateBeforeReload(reason);

    this.reloadTimeout = setTimeout(() => {
      this.performReload();
    }, delayMs);
  }

  /** 🛡️ DÉSACTIVÉ sur mobile natif - les chauffeurs attendent souvent */
  public scheduleReloadWhenIdle() {
    if (isNativeMobile()) {
      console.log('🛡️ [SmartReloader] scheduleReloadWhenIdle DÉSACTIVÉ sur mobile natif');
      return;
    }
    // Web uniquement: pas de reload idle non plus (trop risqué)
    console.log('⏰ [SmartReloader] scheduleReloadWhenIdle désactivé (protection session)');
  }

  private saveStateBeforeReload(reason: ReloadReason) {
    try {
      sessionStorage.setItem('kwenda_reload_state', JSON.stringify({
        reason: reason.type,
        severity: reason.severity,
        message: reason.message,
        timestamp: Date.now(),
        url: window.location.href,
        scrollPosition: { x: window.scrollX, y: window.scrollY }
      }));
    } catch (error) {
      console.error('Erreur sauvegarde état:', error);
    }
  }

  private performReload() {
    console.log('🔄 [SmartReloader] Reload NOW');
    try {
      window.location.reload();
    } catch {
      window.location.href = window.location.href;
    }
  }

  public cancelReload() {
    if (this.reloadTimeout) {
      clearTimeout(this.reloadTimeout);
      this.reloadTimeout = null;
      this.reloadScheduled = false;
    }
  }

  public checkReloadState() {
    try {
      const stateStr = sessionStorage.getItem('kwenda_reload_state');
      if (!stateStr) return null;
      const state = JSON.parse(stateStr);
      sessionStorage.removeItem('kwenda_reload_state');
      
      if (Date.now() - state.timestamp < 10000) {
        if (state.scrollPosition) {
          window.scrollTo(state.scrollPosition.x, state.scrollPosition.y);
        }
        return state;
      }
      return null;
    } catch {
      return null;
    }
  }

  public cleanup() {
    if (this.reloadTimeout) {
      clearTimeout(this.reloadTimeout);
    }
  }
}

export const smartReloader = new SmartReloader();
