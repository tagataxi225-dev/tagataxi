/**
 * 🧭 Service de Navigation GPS
 * Gestion de la navigation turn-by-turn avec Google Maps Directions API
 */

interface NavigationOptions {
  voiceEnabled?: boolean;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  onInstructionChange?: (instruction: string) => void;
  onOffRoute?: () => void;
  onRouteRecalculated?: () => void;
}

interface NavigationRoute {
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
  }>;
  polyline: string;
}

class NavigationService {
  private watchId: number | null = null;
  private currentRoute: NavigationRoute | null = null;
  private currentStepIndex: number = 0;
  private options: NavigationOptions = {};
  private speechSynthesis: SpeechSynthesis | null = null;
  private lastPosition: { lat: number; lng: number } | null = null;

  constructor() {
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
  }

  /**
   * Démarrer la navigation
   */
  async startNavigation(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: NavigationOptions = {}
  ): Promise<NavigationRoute | null> {
    this.options = options;

    try {
      // Calculer l'itinéraire avec Google Directions API
      const route = await this.calculateRoute(origin, destination);
      if (!route) return null;

      this.currentRoute = route;
      this.currentStepIndex = 0;

      // Démarrer le tracking GPS
      this.startGPSTracking();

      // Annoncer la première instruction
      if (route.steps[0]) {
        this.announceInstruction(route.steps[0].instruction);
      }

      return route;
    } catch (error) {
      console.error('Error starting navigation:', error);
      return null;
    }
  }

  /**
   * Calculer l'itinéraire avec Google Directions API (SÉCURISÉ via proxy)
   */
  private async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<NavigationRoute | null> {
    try {
      // ✅ SÉCURISÉ: Appel via Edge Function proxy
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          service: 'directions',
          params: {
            origin: `${origin.lat},${origin.lng}`,
            destination: `${destination.lat},${destination.lng}`,
            mode: 'driving',
            language: 'fr',
            traffic_model: 'best_guess',
            departure_time: 'now'
          }
        }
      });

      if (error) {
        console.error('❌ Erreur proxy directions:', error);
        return null;
      }

      if (data.status === 'OK' && data.routes[0]) {
        const route = data.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance.value,
          duration: leg.duration.value,
          distanceText: leg.distance.text,
          durationText: leg.duration.text,
          steps: leg.steps.map((step: any) => ({
            instruction: this.cleanInstruction(step.html_instructions),
            distance: step.distance.value,
            duration: step.duration.value
          })),
          polyline: route.overview_polyline.points
        };
      }

      return null;
    } catch (error) {
      console.error('Error calculating route:', error);
      return null;
    }
  }

  /**
   * Démarrer le tracking GPS en temps réel (via service natif)
   */
  private async startGPSTracking() {
    try {
      const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
      
      const watchIdStr = await nativeGeolocationService.watchPosition(
        (position) => {
          const currentLocation = {
            lat: position.lat,
            lng: position.lng
          };

          this.lastPosition = currentLocation;

          // Notifier le changement de position
          if (this.options.onLocationUpdate) {
            this.options.onLocationUpdate(currentLocation);
          }

          // Vérifier si on est hors route
          this.checkIfOffRoute(currentLocation);

          // Vérifier si on approche de la prochaine instruction
          this.checkNextInstruction(currentLocation);
        },
        (error) => {
          console.error('GPS tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      
      // Stocker le watchId (string pour Capacitor, number pour web)
      this.watchId = parseInt(watchIdStr) || 0;
    } catch (error) {
      console.error('Failed to start GPS tracking:', error);
    }
  }

  /**
   * Vérifier si le chauffeur est hors route
   */
  private checkIfOffRoute(currentLocation: { lat: number; lng: number }) {
    if (!this.currentRoute) return;

    const currentStep = this.currentRoute.steps[this.currentStepIndex];
    if (!currentStep) return;

    // Calculer distance à la route (simplifié)
    // En production: utiliser polyline decoding + distance au segment
    const distanceThreshold = 100; // 100 mètres
    
    // Si trop loin, déclencher recalcul
    if (this.lastPosition) {
      const distance = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        this.lastPosition.lat,
        this.lastPosition.lng
      );
      
      if (distance > distanceThreshold) {
        if (this.options.onOffRoute) {
          this.options.onOffRoute();
        }
        // Auto-recalcul
        this.recalculateRoute(currentLocation);
      }
    }
  }

  /**
   * Recalculer l'itinéraire automatiquement
   */
  private async recalculateRoute(currentLocation: { lat: number; lng: number }): Promise<void> {
    if (!this.currentRoute) return;

    // Déterminer la destination actuelle (pickup ou destination finale)
    const targetLocation = this.lastPosition; // À adapter selon la logique métier

    try {
      const newRoute = await this.calculateRoute(currentLocation, targetLocation!);
      
      if (newRoute) {
        this.currentRoute = newRoute;
        this.currentStepIndex = 0;
        
        if (this.options.onRouteRecalculated) {
          this.options.onRouteRecalculated();
        }
        
        // Annoncer nouvelle instruction
        if (newRoute.steps[0]) {
          this.announceInstruction(newRoute.steps[0].instruction);
        }
      }
    } catch (error) {
      console.error('Erreur recalcul itinéraire:', error);
    }
  }

  /**
   * Vérifier si on approche de la prochaine instruction
   */
  private checkNextInstruction(currentLocation: { lat: number; lng: number }) {
    if (!this.currentRoute || this.currentStepIndex >= this.currentRoute.steps.length) return;

    const currentStep = this.currentRoute.steps[this.currentStepIndex];
    
    // Calculer distance restante approximative
    if (this.lastPosition) {
      const movedDistance = this.calculateDistance(
        this.lastPosition.lat,
        this.lastPosition.lng,
        currentLocation.lat,
        currentLocation.lng
      );
      
      // Si on a parcouru plus de 80% de l'étape, passer à la suivante
      if (movedDistance > currentStep.distance * 0.8) {
        this.currentStepIndex++;
        
        if (this.currentStepIndex < this.currentRoute.steps.length) {
          const nextStep = this.currentRoute.steps[this.currentStepIndex];
          this.announceInstruction(nextStep.instruction);
        }
      }
    }
  }

  /**
   * Annoncer une instruction vocalement
   */
  announceInstruction(instruction: string) {
    if (this.options.onInstructionChange) {
      this.options.onInstructionChange(instruction);
    }

    if (this.options.voiceEnabled !== false) {
      this.speakInstruction(instruction);
    }
  }

  /**
   * Parler une instruction avec Speech Synthesis
   */
  speakInstruction(text: string) {
    if (!this.speechSynthesis) return;

    // Annuler toute lecture en cours
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    this.speechSynthesis.speak(utterance);
  }

  /**
   * Activer/désactiver les instructions vocales
   */
  setVoiceEnabled(enabled: boolean) {
    this.options.voiceEnabled = enabled;
    if (!enabled && this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }

  /**
   * Arrêter la navigation
   */
  async stopNavigation() {
    if (this.watchId !== null) {
      try {
        const { nativeGeolocationService } = await import('@/services/nativeGeolocationService');
        await nativeGeolocationService.clearWatch(String(this.watchId));
      } catch (error) {
        // Fallback pour compatibilité
        navigator.geolocation?.clearWatch(this.watchId);
      }
      this.watchId = null;
    }

    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }

    this.currentRoute = null;
    this.currentStepIndex = 0;
    this.lastPosition = null;
  }

  /**
   * Calculer la distance restante
   */
  getRemainingDistance(): number {
    if (!this.currentRoute) return 0;

    let remaining = 0;
    for (let i = this.currentStepIndex; i < this.currentRoute.steps.length; i++) {
      remaining += this.currentRoute.steps[i].distance;
    }

    return remaining;
  }

  /**
   * Calculer le temps restant estimé
   */
  getRemainingDuration(): number {
    if (!this.currentRoute) return 0;

    let remaining = 0;
    for (let i = this.currentStepIndex; i < this.currentRoute.steps.length; i++) {
      remaining += this.currentRoute.steps[i].duration;
    }

    return remaining;
  }

  /**
   * Nettoyer les instructions HTML de Google Maps
   */
  private cleanInstruction(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * Calculer la distance entre deux points (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const navigationService = new NavigationService();
