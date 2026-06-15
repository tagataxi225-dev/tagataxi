const WELCOME_KEY = 'kwenda_services_intro_v1';
const NEVER_SHOW_KEY = 'kwenda_services_intro_never';

export const welcomeCarouselUtils = {
  /**
   * Vérifie si le carrousel doit être affiché (une fois par jour)
   */
  shouldShow(): boolean {
    // Vérifier si l'utilisateur a désactivé définitivement
    const neverShow = localStorage.getItem(NEVER_SHOW_KEY);
    if (neverShow === 'true') {
      console.log('⏭️ [WelcomeCarousel] Disabled by user');
      return false;
    }

    const lastShown = localStorage.getItem(WELCOME_KEY);
    
    // Première fois
    if (!lastShown) {
      console.log('🎉 [WelcomeCarousel] First time - will show');
      return true;
    }
    
    const lastShownTimestamp = parseInt(lastShown, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const timeSinceLastShow = now - lastShownTimestamp;
    const shouldShow = timeSinceLastShow >= twentyFourHours;
    
    if (shouldShow) {
      console.log('🎉 [WelcomeCarousel] 24h elapsed - will show', {
        lastShown: new Date(lastShownTimestamp).toLocaleString(),
        timeSince: `${Math.floor(timeSinceLastShow / (1000 * 60 * 60))}h`,
      });
    } else {
      const hoursLeft = Math.ceil((twentyFourHours - timeSinceLastShow) / (1000 * 60 * 60));
      console.log('⏭️ [WelcomeCarousel] Skipping - shown recently', {
        lastShown: new Date(lastShownTimestamp).toLocaleString(),
        nextShow: new Date(lastShownTimestamp + twentyFourHours).toLocaleString(),
        hoursLeft: `${hoursLeft}h`,
      });
    }
    
    return shouldShow;
  },
  
  /**
   * Enregistre l'affichage du carrousel
   */
  markAsShown(): void {
    localStorage.setItem(WELCOME_KEY, Date.now().toString());
    console.log('✅ [WelcomeCarousel] Marked as shown at', new Date().toLocaleString());
  },
  
  /**
   * Réinitialise le compteur (pour tests/debug)
   */
  reset(): void {
    localStorage.removeItem(WELCOME_KEY);
    localStorage.removeItem(NEVER_SHOW_KEY);
    console.log('🔄 [WelcomeCarousel] Reset - will show on next page load');
  },
  
  /**
   * Désactive définitivement l'affichage
   */
  disablePermanently(): void {
    localStorage.setItem(NEVER_SHOW_KEY, 'true');
    console.log('🚫 [WelcomeCarousel] Permanently disabled');
  },
  
  /**
   * Récupère les infos de dernier affichage
   */
  getLastShownInfo(): { 
    lastShown: Date | null; 
    nextShow: Date | null;
    neverShow: boolean;
  } {
    const neverShow = localStorage.getItem(NEVER_SHOW_KEY) === 'true';
    const lastShown = localStorage.getItem(WELCOME_KEY);
    
    if (!lastShown) {
      return { 
        lastShown: null, 
        nextShow: null,
        neverShow 
      };
    }
    
    const timestamp = parseInt(lastShown, 10);
    return {
      lastShown: new Date(timestamp),
      nextShow: new Date(timestamp + 24 * 60 * 60 * 1000),
      neverShow
    };
  }
};

// Exposer globalement pour debug console
if (typeof window !== 'undefined') {
  (window as any).resetWelcomeCarousel = welcomeCarouselUtils.reset;
  (window as any).welcomeCarouselInfo = () => {
    const info = welcomeCarouselUtils.getLastShownInfo();
    console.log('📊 [WelcomeCarousel] Info:', {
      neverShow: info.neverShow,
      lastShown: info.lastShown?.toLocaleString() || 'never',
      nextShow: info.nextShow?.toLocaleString() || 'on next load',
      shouldShow: welcomeCarouselUtils.shouldShow()
    });
    return info;
  };
}
