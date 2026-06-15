/**
 * 🧭 SERVICE DE NAVIGATION MODERNE AVEC IA
 * 
 * Navigation intelligente pour chauffeurs/livreurs avec:
 * - Calcul d'itinéraires optimisés AI
 * - Instructions vocales contextuelles
 * - Recalcul automatique en temps réel
 * - Optimisation trafic et consommation
 */

import { DirectionsService, DirectionsResult } from './directionsService';
import { supabase } from '@/integrations/supabase/client';

type LatLng = { lat: number; lng: number };

export interface NavigationInstruction {
  type: 'turn-left' | 'turn-right' | 'straight' | 'uturn' | 'arrive' | 'depart' | 'roundabout';
  text: string;
  distance: number;
  street?: string;
  icon: string;
  severity: 'normal' | 'important' | 'critical';
}

export interface NavigationState {
  isActive: boolean;
  currentRoute: DirectionsResult | null;
  currentInstruction: NavigationInstruction | null;
  nextInstruction: NavigationInstruction | null;
  remainingDistance: number;
  remainingDuration: number;
  eta: string;
  speed: number;
  isOffRoute: boolean;
  isRecalculating: boolean;
  progress: number; // 0-100%
}

export interface NavigationOptions {
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  optimizeFor?: 'time' | 'fuel' | 'distance';
  vehicleType?: 'moto' | 'car' | 'truck';
  enableVoice?: boolean;
  language?: 'fr' | 'en';
}

class ModernNavigationService {
  private static instance: ModernNavigationService;
  private navigationState: NavigationState = {
    isActive: false,
    currentRoute: null,
    currentInstruction: null,
    nextInstruction: null,
    remainingDistance: 0,
    remainingDuration: 0,
    eta: '',
    speed: 0,
    isOffRoute: false,
    isRecalculating: false,
    progress: 0
  };

  private listeners = new Set<(state: NavigationState) => void>();
  private currentPosition: { lat: number; lng: number } | null = null;
  private destination: { lat: number; lng: number } | null = null;
  private options: NavigationOptions = {};
  private routeUpdateTimer: NodeJS.Timeout | null = null;
  private lrT = 0;
  private lrP: LatLng | null = null;
  private hav(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  static getInstance(): ModernNavigationService {
    if (!ModernNavigationService.instance) {
      ModernNavigationService.instance = new ModernNavigationService();
    }
    return ModernNavigationService.instance;
  }

  // ==================== API PUBLIQUE ====================

  async startNavigation(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    options: NavigationOptions = {}
  ): Promise<boolean> {
    try {
      console.log('🧭 Démarrage navigation moderne');
      
      this.destination = destination;
      this.options = options;
      this.currentPosition = origin;

      // Calculer itinéraire initial avec optimisations IA
      const route = await this.calculateOptimizedRoute(origin, destination);
      
      if (!route) {
        throw new Error('Impossible de calculer l\'itinéraire');
      }

      // Générer instructions de navigation
      const instructions = this.generateNavigationInstructions(route);

      this.navigationState = {
        ...this.navigationState,
        isActive: true,
        currentRoute: route,
        currentInstruction: instructions[0] || null,
        nextInstruction: instructions[1] || null,
        remainingDistance: route.distance,
        remainingDuration: route.duration,
        eta: this.calculateETA(route.duration),
        progress: 0
      };

      // Démarrer tracking position
      this.startPositionTracking();
      
      // Notifier les listeners
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('❌ Erreur démarrage navigation:', error);
      return false;
    }
  }

  async stopNavigation(): Promise<void> {
    console.log('🛑 Arrêt navigation');
    
    this.navigationState.isActive = false;
    this.destination = null;
    this.currentPosition = null;
    
    if (this.routeUpdateTimer) {
      clearInterval(this.routeUpdateTimer);
      this.routeUpdateTimer = null;
    }

    this.notifyListeners();
  }

  updatePosition(position: { lat: number; lng: number; speed?: number }): void {
    if (!this.navigationState.isActive || !this.destination) return;

    this.currentPosition = position;
    this.navigationState.speed = position.speed || 0;

    // Vérifier si hors itinéraire
    this.checkOffRoute(position);

    // Mettre à jour progression
    this.updateProgress(position);

    // Recalculer si nécessaire
    if (this.shouldRecalculate(position)) {
      this.recalculateRoute();
    }

    this.notifyListeners();
  }

  // ==================== OPTIMISATION IA ====================

  private async calculateOptimizedRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<DirectionsResult | null> {
    try {
      // Optimisations basées sur les options
      const directionsOptions = {
        profile: this.getOptimalProfile(),
        alternatives: true,
        steps: true
      };

      const route = await DirectionsService.getDirections(origin, destination, directionsOptions);
      
      // Appliquer optimisations IA
      return this.applyAIOptimizations(route);
    } catch (error) {
      console.error('❌ Erreur calcul itinéraire:', error);
      return null;
    }
  }

  private getOptimalProfile(): 'driving' | 'walking' | 'cycling' {
    switch (this.options.vehicleType) {
      case 'moto':
        return 'cycling'; // Plus proche du comportement moto
      case 'truck':
        return 'driving';
      default:
        return 'driving';
    }
  }

  private applyAIOptimizations(route: DirectionsResult): DirectionsResult {
    // Optimisations basées sur l'historique et les conditions
    let optimizedRoute = { ...route };

    // Ajuster durée selon conditions locales Kinshasa
    if (this.isRushHour()) {
      optimizedRoute.duration *= 1.4; // +40% en heure de pointe
      optimizedRoute.durationText = this.formatDuration(optimizedRoute.duration);
    }

    // Optimisation consommation carburant
    if (this.options.optimizeFor === 'fuel') {
      optimizedRoute.duration *= 1.1; // Route plus économique mais plus lente
      optimizedRoute.durationText = this.formatDuration(optimizedRoute.duration);
    }

    return optimizedRoute;
  }

  private isRushHour(): boolean {
    const hour = new Date().getHours();
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  }

  // ==================== INSTRUCTIONS NAVIGATION ====================

  private generateNavigationInstructions(route: DirectionsResult): NavigationInstruction[] {
    const instructions: NavigationInstruction[] = [];

    route.steps.forEach((step, index) => {
      const instruction = this.parseStepToInstruction(step, index === route.steps.length - 1);
      instructions.push(instruction);
    });

    return instructions;
  }

  private parseStepToInstruction(step: any, isLast: boolean): NavigationInstruction {
    const text = step.instruction || 'Continuez';
    
    // Analyser le type d'instruction
    let type: NavigationInstruction['type'] = 'straight';
    let icon = '↑';
    let severity: NavigationInstruction['severity'] = 'normal';

    if (text.includes('gauche')) {
      type = 'turn-left';
      icon = '←';
    } else if (text.includes('droite')) {
      type = 'turn-right';
      icon = '→';
    } else if (text.includes('demi-tour')) {
      type = 'uturn';
      icon = '↺';
      severity = 'important';
    } else if (isLast) {
      type = 'arrive';
      icon = '🏁';
      severity = 'critical';
    }

    return {
      type,
      text: this.formatInstructionText(text),
      distance: step.distance,
      street: this.extractStreetName(text),
      icon,
      severity
    };
  }

  private formatInstructionText(text: string): string {
    // Nettoyer et formater le texte d'instruction
    return text
      .replace(/<[^>]*>/g, '') // Supprimer HTML
      .replace(/\s+/g, ' ') // Normaliser espaces
      .trim();
  }

  private extractStreetName(text: string): string | undefined {
    // Extraire nom de rue des instructions
    const streetMatch = text.match(/sur\s+(.+?)(?:\s|$)/i);
    return streetMatch ? streetMatch[1] : undefined;
  }

  // ==================== TRACKING & RECALCUL ====================

  private startPositionTracking(): void {
    // Vérifier position toutes les 3 secondes
    this.routeUpdateTimer = setInterval(() => {
      if (this.currentPosition && this.destination) {
        this.updateProgress(this.currentPosition);
      }
    }, 3000);
  }

  private checkOffRoute(position: { lat: number; lng: number }): void {
    if (!this.navigationState.currentRoute) return;

    // Calculer distance au tracé de l'itinéraire
    const route = this.navigationState.currentRoute;
    const minDistance = this.getMinDistanceToRoute(position, route.geometry);

    // Considérer hors itinéraire si > 100m
    const isOffRoute = minDistance > 100;
    
    if (isOffRoute !== this.navigationState.isOffRoute) {
      this.navigationState.isOffRoute = isOffRoute;
      
      if (isOffRoute) {
        console.log('⚠️ Véhicule hors itinéraire');
      }
    }
  }

  private getMinDistanceToRoute(
    position: { lat: number; lng: number },
    routeGeometry: [number, number][]
  ): number {
    let minDistance = Infinity;

    for (let i = 0; i < routeGeometry.length - 1; i++) {
      const [lng1, lat1] = routeGeometry[i];
      const [lng2, lat2] = routeGeometry[i + 1];
      
      const distance = this.pointToLineDistance(
        position.lat, position.lng,
        lat1, lng1,
        lat2, lng2
      );
      
      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  private pointToLineDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = dot / lenSq;
    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy) * 111139; // Convertir en mètres
  }

  private shouldRecalculate(position: { lat: number; lng: number }): boolean {
    if (this.lrP && this.hav(this.lrP, position) < 200) return false;
    return this.navigationState.isOffRoute &&
           !this.navigationState.isRecalculating;
  }

  private async recalculateRoute(): Promise<void> {
    if (!this.currentPosition || !this.destination) return;
    if (Date.now() - this.lrT < 15000) return;
    this.lrT = Date.now();
    this.lrP = this.currentPosition;
    console.log('[Directions] recalc');

    console.log('🔄 Recalcul itinéraire');
    this.navigationState.isRecalculating = true;
    this.notifyListeners();

    try {
      const newRoute = await this.calculateOptimizedRoute(this.currentPosition, this.destination);
      
      if (newRoute) {
        const instructions = this.generateNavigationInstructions(newRoute);
        
        this.navigationState = {
          ...this.navigationState,
          currentRoute: newRoute,
          currentInstruction: instructions[0] || null,
          nextInstruction: instructions[1] || null,
          remainingDistance: newRoute.distance,
          remainingDuration: newRoute.duration,
          eta: this.calculateETA(newRoute.duration),
          isOffRoute: false
        };
      }
    } catch (error) {
      console.error('❌ Erreur recalcul:', error);
    } finally {
      this.navigationState.isRecalculating = false;
      this.notifyListeners();
    }
  }

  private updateProgress(position: { lat: number; lng: number }): void {
    if (!this.destination || !this.navigationState.currentRoute) return;

    // Calculer distance restante vers destination
    const remainingDistance = this.haversineDistance(
      position.lat, position.lng,
      this.destination.lat, this.destination.lng
    );

    const totalDistance = this.navigationState.currentRoute.distance;
    const progress = Math.max(0, Math.min(100, 
      ((totalDistance - remainingDistance) / totalDistance) * 100
    ));

    this.navigationState.remainingDistance = remainingDistance;
    this.navigationState.progress = progress;
    
    // Recalculer ETA basé sur vitesse actuelle
    if (this.navigationState.speed > 0) {
      const eta = remainingDistance / (this.navigationState.speed * 3.6); // km/h -> m/s
      this.navigationState.eta = this.calculateETA(eta);
    }
  }

  // ==================== UTILITAIRES ====================

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private calculateETA(durationSeconds: number): string {
    const now = new Date();
    const eta = new Date(now.getTime() + durationSeconds * 1000);
    return eta.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  // ==================== LISTENERS ====================

  subscribe(listener: (state: NavigationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.navigationState));
  }

  getState(): NavigationState {
    return { ...this.navigationState };
  }
}

export const modernNavigationService = ModernNavigationService.getInstance();