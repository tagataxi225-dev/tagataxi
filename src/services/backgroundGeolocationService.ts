/**
 * 🛰️ SERVICE DE GÉOLOCALISATION ARRIÈRE-PLAN (BACKGROUND)
 *
 * ✅ v6: Intégration Capacitor Background Geolocation pour les chauffeurs
 * Gère le tracking même quand l'application est en arrière-plan ou fermée.
 *
 * TODO: ce service est un doublon de trackingService, à unifier.
 * Utilisé par : useBackgroundTracking.tsx, useDriverGeolocation.ts
 * trackingService gère déjà le tracking adaptatif + offline buffer.
 * Unification suggérée : migrer useBackgroundTracking et useDriverGeolocation
 * vers trackingService avec option backgroundMode: true.
 */

import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';
import type { 
  BackgroundGeolocationPlugin, 
  WatcherOptions 
} from '@capacitor-community/background-geolocation';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

export interface BackgroundLocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  bearing: number | null;
  speed: number | null;
  time: number;
}

class BackgroundGeolocationService {
  private isNative: boolean;
  private watcherId: string | null = null;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    console.log(`🛰️ BackgroundGeo Service: ${this.isNative ? 'Native' : 'Web (Simulated)'}`);
  }

  /**
   * Démarre le tracking en arrière-plan
   */
  async startTracking(
    callback: (location: BackgroundLocationUpdate) => void,
    options: WatcherOptions = {}
  ): Promise<string> {
    if (!this.isNative) {
      console.warn('🛰️ Background tracking not supported on Web. Using navigator.geolocation fallback.');
      const id = navigator.geolocation.watchPosition(
        (pos) => callback({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          bearing: pos.coords.heading,
          speed: pos.coords.speed,
          time: pos.timestamp
        }),
        (err) => console.error('Web Geo Error:', err),
        { enableHighAccuracy: true }
      );
      this.watcherId = String(id);
      return this.watcherId;
    }

    try {
      // Configuration optimale pour chauffeur taxi
      const config: WatcherOptions = {
        backgroundMessage: "TAGA suit votre position pour les courses à proximité.",
        backgroundTitle: "TAGA Chauffeur en ligne",
        requestPermissions: true,
        stale: false,
        distanceFilter: 10, // Mettre à jour tous les 10 mètres minimum
        ...options
      };

      this.watcherId = await BackgroundGeolocation.addWatcher(
        config,
        (location, error) => {
          if (error) {
            console.error('🛰️ Background Geo Error:', error);
            return;
          }
          if (location) {
            callback(location as BackgroundLocationUpdate);
          }
        }
      );

      console.log('🛰️ Background tracking started with ID:', this.watcherId);
      return this.watcherId;
    } catch (err) {
      console.error('🛰️ Failed to start background tracking:', err);
      throw err;
    }
  }

  /**
   * Arrête le tracking
   */
  async stopTracking(): Promise<void> {
    if (!this.watcherId) return;

    if (!this.isNative) {
      navigator.geolocation.clearWatch(Number(this.watcherId));
    } else {
      try {
        await BackgroundGeolocation.removeWatcher({ id: this.watcherId });
      } catch (err) {
        console.error('🛰️ Error removing background watcher:', err);
      }
    }

    console.log('🛰️ Background tracking stopped');
    this.watcherId = null;
  }

  /**
   * Vérifie si le tracking est actif
   */
  isActive(): boolean {
    return this.watcherId !== null;
  }
}

export const backgroundGeolocationService = new BackgroundGeolocationService();
