/**
 * 📱 SERVICE DE GÉOLOCALISATION NATIF UNIFIÉ
 * 
 * ✅ v5: Fix natif — isSafari=false sur Capacitor, permission short-circuit,
 * messages natifs cohérents (jamais "Safari" sur une app native)
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';

export interface NativeLocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  source: 'capacitor' | 'browser' | 'fallback';
}

export interface NativeGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  minAccuracy?: number;
}

export interface GeolocationResult extends NativeLocationData {
  isPrecise: boolean;
  reason?: 'gps_hardware' | 'gps_cache' | 'wifi' | 'ip_fallback' | 'timeout_best_effort';
}

export type GeolocationErrorType = 
  | 'permission_denied'
  | 'permission_denied_permanent'
  | 'services_disabled'
  | 'timeout'
  | 'position_unavailable'
  | 'unknown';

export class GeolocationError extends Error {
  type: GeolocationErrorType;
  canRetry: boolean;
  needsSettings: boolean;
  
  constructor(message: string, type: GeolocationErrorType) {
    super(message);
    this.type = type;
    this.canRetry = type === 'timeout' || type === 'position_unavailable';
    this.needsSettings = type === 'permission_denied_permanent' || type === 'services_disabled';
  }
}

class NativeGeolocationService {
  private isNative: boolean;
  private permissionGranted: boolean = false;
  private lastKnownPosition: NativeLocationData | null = null;
  private isSafari: boolean;

  constructor() {
    try {
      this.isNative = Capacitor.isNativePlatform();
    } catch {
      console.warn('📍 NativeGeo: Capacitor not available, falling back to browser');
      this.isNative = false;
    }
    
    // ✅ FIX: Sur Capacitor natif, la WebView contient "Safari" dans le UA mais ce n'est PAS Safari
    if (this.isNative) {
      this.isSafari = false;
    } else {
      try {
        const ua = navigator.userAgent;
        this.isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|Edg/.test(ua);
      } catch {
        this.isSafari = false;
      }
    }
    console.log(`📍 NativeGeo v5: ${this.isNative ? 'Capacitor' : 'Browser'}${this.isSafari ? ' (Safari)' : ''}`);
  }

  async checkPermissions(): Promise<PermissionStatus> {
    if (!this.isNative) {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          console.log('📍 [GPS] Browser permission state:', result.state);
          return { location: result.state as any, coarseLocation: result.state as any } as PermissionStatus;
        }
      } catch {
        // Safari doesn't support permissions.query for geolocation
      }
      return { location: 'prompt', coarseLocation: 'prompt' } as PermissionStatus;
    }
    try {
      const result = await Geolocation.checkPermissions();
      console.log('📍 [GPS] checkPermissions result:', JSON.stringify(result));
      return result;
    } catch (error: any) {
      const msg = (error?.message || '').toLowerCase();
      console.error('❌ [GPS] checkPermissions THREW:', error?.message, '| code:', error?.code);
      
      if (msg.includes('os-plug-gloc-0007') || msg.includes('os-plug-gloc-0008') || 
          msg.includes('disabled') || msg.includes('services')) {
        throw new GeolocationError(
          'Services de localisation désactivés sur l\'appareil. Activez le GPS dans les Paramètres.',
          'services_disabled'
        );
      }
      return { location: 'denied', coarseLocation: 'denied' } as PermissionStatus;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isNative) {
      this.permissionGranted = true;
      return true;
    }
    try {
      const result = await Geolocation.requestPermissions();
      this.permissionGranted = result.location === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('❌ Request permissions error:', error);
      return false;
    }
  }

  /**
   * ✅ v5: Simplifié — requestPermissions() une fois, si denied → throw immédiat
   * Plus de retry 500ms ni de getCurrentPosition test
   */
  async ensurePermissions(): Promise<boolean> {
    let status: PermissionStatus;
    try {
      status = await this.checkPermissions();
    } catch (error) {
      throw error;
    }
    
    console.log('📍 [GPS] ensurePermissions status:', status.location);
    
    if (status.location === 'granted') {
      this.permissionGranted = true;
      return true;
    }
    
    // Android 12+ peut accorder coarseLocation sans fine
    if ((status as any).coarseLocation === 'granted') {
      console.log('📍 Coarse location granted, accepting');
      this.permissionGranted = true;
      return true;
    }
    
    if (status.location === 'prompt' || status.location === 'prompt-with-rationale') {
      const granted = await this.requestPermissions();
      if (granted) return true;
      // requestPermissions returned false → user denied
      throw this.createNativePermissionError();
    }
    
    if (status.location === 'denied' && this.isNative) {
      // ✅ FIX Android: Toujours tenter requestPermissions() au moins une fois
      // Sur Android 12+, checkPermissions() peut retourner 'denied' même avant le 1er prompt
      console.log('📍 [GPS] Status denied, attempting requestPermissions() (Android may show dialog)...');
      const granted = await this.requestPermissions();
      if (granted) return true;
      
      // requestPermissions() refusé — attendre propagation + recheck
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('📍 [GPS] requestPermissions denied, rechecking after 300ms...');
      try {
        const recheck = await this.checkPermissions();
        console.log('📍 [GPS] Recheck after denied:', recheck.location);
        if (recheck.location === 'granted' || (recheck as any).coarseLocation === 'granted') {
          this.permissionGranted = true;
          return true;
        }
      } catch { /* ignore */ }
      
      // Définitivement denied → guider vers les paramètres
      throw this.createNativePermissionError();
    }
    
    return false;
  }

  /**
   * Crée une erreur de permission avec le bon message natif (jamais Safari)
   */
  private createNativePermissionError(): GeolocationError {
    const isAndroid = /Android/.test(navigator.userAgent);
    const isIOS = /iPhone|iPad/.test(navigator.userAgent);
    
    if (this.isNative) {
      if (isAndroid) {
        return new GeolocationError(
          'GPS désactivé pour TAGA. Allez dans Paramètres > Applications > TAGA > Permissions > Localisation > Autoriser.',
          'permission_denied_permanent'
        );
      }
      if (isIOS) {
        return new GeolocationError(
          'GPS désactivé pour TAGA. Allez dans Réglages > Confidentialité > Service de localisation > TAGA > Lorsque l\'app est active.',
          'permission_denied_permanent'
        );
      }
    }
    return new GeolocationError('Permission GPS refusée.', 'permission_denied');
  }

  /**
   * 📍 Position rapide — UN SEUL appel, respect strict du timeout
   */
  async getCurrentPosition(options: NativeGeolocationOptions = {}): Promise<NativeLocationData> {
    const isNativeRuntime = Capacitor.isNativePlatform();
    const {
      enableHighAccuracy = true,
      timeout = 20000,
      maximumAge = 0
    } = options;

    if (isNativeRuntime !== this.isNative) {
      this.isNative = isNativeRuntime;
    }

    const hasPermission = await this.ensurePermissions();
    if (!hasPermission) {
      throw this.createNativePermissionError();
    }

    try {
      let position: NativeLocationData;
      
      if (this.isNative) {
        position = await this.getNativePositionWithFallbacks(enableHighAccuracy, timeout, maximumAge);
      } else {
        position = await this.getBrowserPositionSingle({ enableHighAccuracy, timeout, maximumAge });
      }
      
      this.lastKnownPosition = position;
      console.log(`📍 Position: ±${Math.round(position.accuracy)}m [${position.source}]`);
      return position;
    } catch (e: any) {
      // ✅ FIX: Si on est en natif, toujours remonter un message natif
      if (this.isNative && !(e instanceof GeolocationError)) {
        const errorType = this.classifyNativeError(e);
        if (errorType === 'permission_denied' || errorType === 'permission_denied_permanent') {
          throw this.createNativePermissionError();
        }
        if (errorType === 'services_disabled') {
          throw new GeolocationError(
            'Services de localisation désactivés. Activez le GPS dans les Paramètres.',
            'services_disabled'
          );
        }
        throw new GeolocationError(e.message || 'Position GPS indisponible', errorType);
      }
      // Re-throw GeolocationError as-is
      throw e;
    }
  }

  /**
   * 🎯 Position PRÉCISE — watch progressif avec deadline unique
   */
  async getPreciseInitialPosition(options: {
    minAccuracy?: number;
    maxWait?: number;
    onProgress?: (status: string, accuracy?: number) => void;
  } = {}): Promise<GeolocationResult> {
    const { minAccuracy = 80, maxWait = 15000, onProgress } = options;
    const deadline = Date.now() + maxWait;

    onProgress?.('Acquisition GPS...', undefined);

    let bestPosition: NativeLocationData | null = null;
    try {
      const fast = await this.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 3000
      });
      bestPosition = fast;
      onProgress?.(`Position obtenue (±${Math.round(fast.accuracy)}m)`, fast.accuracy);
      
      if (fast.accuracy <= minAccuracy) {
        return { ...fast, isPrecise: true, reason: 'gps_cache' };
      }
    } catch (e) {
      // If permission error, don't continue to watch
      if (e instanceof GeolocationError && (e.type === 'permission_denied' || e.type === 'permission_denied_permanent' || e.type === 'services_disabled')) {
        throw e;
      }
      console.warn('⚠️ Fast fix failed, trying watch...');
    }

    const remainingTime = deadline - Date.now();
    if (remainingTime <= 0 && bestPosition) {
      return { ...bestPosition, isPrecise: bestPosition.accuracy <= minAccuracy, reason: 'timeout_best_effort' };
    }

    return new Promise<GeolocationResult>((resolve, reject) => {
      let watchId: string | null = null;
      let resolved = false;
      
      const finish = (pos: NativeLocationData, reason: GeolocationResult['reason']) => {
        if (resolved) return;
        resolved = true;
        if (watchId) this.clearWatch(watchId).catch(() => {});
        clearTimeout(timeoutId);
        this.lastKnownPosition = pos;
        resolve({ ...pos, isPrecise: pos.accuracy <= minAccuracy, reason });
      };

      const timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        if (watchId) this.clearWatch(watchId).catch(() => {});
        if (bestPosition) {
          onProgress?.(`Meilleure position: ±${Math.round(bestPosition.accuracy)}m`, bestPosition.accuracy);
          this.lastKnownPosition = bestPosition;
          resolve({ ...bestPosition, isPrecise: bestPosition.accuracy <= minAccuracy, reason: 'timeout_best_effort' });
        } else {
          reject(new GeolocationError('Impossible d\'obtenir votre position GPS.', 'timeout'));
        }
      }, Math.max(remainingTime, 2000));

      this.watchPosition(
        (pos) => {
          if (!bestPosition || pos.accuracy < bestPosition.accuracy) {
            bestPosition = pos;
            onProgress?.(`GPS: ±${Math.round(pos.accuracy)}m`, pos.accuracy);
          }
          if (pos.accuracy <= minAccuracy) {
            finish(pos, 'gps_hardware');
          }
        },
        (err) => console.warn('Watch error:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      ).then(id => { watchId = id; }).catch(() => {});
    });
  }

  /**
   * 🔍 Classifier les erreurs natives
   */
  private classifyNativeError(error: any): GeolocationErrorType {
    const msg = (error?.message || error?.toString() || '').toLowerCase();
    const code = error?.code;

    if (msg.includes('os-plug-gloc-0003') || msg.includes('denied') || msg.includes('permission')) {
      if (msg.includes('permanently') || msg.includes('don\'t ask again') || msg.includes('never')) {
        return 'permission_denied_permanent';
      }
      return 'permission_denied';
    }
    if (msg.includes('os-plug-gloc-0007') || msg.includes('os-plug-gloc-0008') || 
        msg.includes('services') || msg.includes('disabled') || msg.includes('location service')) {
      return 'services_disabled';
    }
    if (msg.includes('os-plug-gloc-0010') || msg.includes('timeout') || code === 3) {
      return 'timeout';
    }
    if (msg.includes('unavailable') || code === 2) {
      return 'position_unavailable';
    }
    // Browser PERMISSION_DENIED code = 1
    if (code === 1) {
      return 'permission_denied';
    }
    return 'unknown';
  }

  /**
   * 📱 Stratégie GPS native "fast-then-precise" avec fallback WebView
   * ✅ v5: Court-circuite si PERMISSION_DENIED — pas de fallback browser inutile
   */
  private async getNativePositionWithFallbacks(
    enableHighAccuracy: boolean,
    timeout: number,
    maximumAge: number
  ): Promise<NativeLocationData> {
    // Étape 1: Fix rapide (cell/WiFi, low accuracy, cache 30s)
    try {
      console.log('📍 [Native] Étape 1: fix rapide (cell/WiFi, 5s)...');
      const fastPos: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 30000
      });
      console.log(`📍 [Native] Fix rapide OK: ±${Math.round(fastPos.coords.accuracy)}m`);
      return {
        lat: fastPos.coords.latitude,
        lng: fastPos.coords.longitude,
        accuracy: fastPos.coords.accuracy,
        timestamp: fastPos.timestamp,
        source: 'capacitor'
      };
    } catch (e1: any) {
      console.warn('⚠️ [Native] Fix rapide échoué:', e1.message);
      // ✅ FIX: Si permission denied, stop immédiat — pas la peine de continuer
      const type1 = this.classifyNativeError(e1);
      if (type1 === 'permission_denied' || type1 === 'permission_denied_permanent' || type1 === 'services_disabled') {
        console.error('❌ [Native] Permission/services error — aborting all steps');
        throw this.createNativePermissionError();
      }
    }

    // Étape 2: Fix précis avec les options demandées
    try {
      console.log(`📍 [Native] Étape 2: fix précis (highAccuracy=${enableHighAccuracy}, ${timeout/1000}s)...`);
      const precisePos: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge
      });
      console.log(`📍 [Native] Fix précis OK: ±${Math.round(precisePos.coords.accuracy)}m`);
      return {
        lat: precisePos.coords.latitude,
        lng: precisePos.coords.longitude,
        accuracy: precisePos.coords.accuracy,
        timestamp: precisePos.timestamp,
        source: 'capacitor'
      };
    } catch (e2: any) {
      console.warn('⚠️ [Native] Fix précis échoué:', e2.message);
      // ✅ FIX: Si permission denied, stop immédiat
      const type2 = this.classifyNativeError(e2);
      if (type2 === 'permission_denied' || type2 === 'permission_denied_permanent' || type2 === 'services_disabled') {
        throw this.createNativePermissionError();
      }
    }

    // Étape 3: Fallback WebView navigator.geolocation (seulement pour timeout/unavailable)
    console.log('📍 [Native] Étape 3: fallback WebView navigator.geolocation...');
    try {
      const browserPos = await this.browserGeoPromise(
        {
          enableHighAccuracy: true,
          timeout: Math.min(timeout, 10000),
          maximumAge: 0
        },
        true // ✅ isNativeContext = true → messages natifs, pas Safari
      );
      console.log(`📍 [Native] Fallback WebView OK: ±${Math.round(browserPos.accuracy)}m`);
      return { ...browserPos, source: 'browser' };
    } catch (e3: any) {
      console.error('❌ [Native] Toutes les stratégies GPS ont échoué');
      // ✅ FIX: Toujours remonter un message natif, jamais Safari
      if (e3 instanceof GeolocationError) {
        if (e3.type === 'permission_denied' || e3.type === 'permission_denied_permanent') {
          throw this.createNativePermissionError();
        }
        throw e3;
      }
      throw this.createNativePermissionError();
    }
  }

  /**
   * 🌐 Browser position — stratégie en 2 temps pour Safari iOS / Android
   */
  private async getBrowserPositionSingle(options: NativeGeolocationOptions): Promise<NativeLocationData> {
    if (!navigator.geolocation) {
      throw new GeolocationError('Géolocalisation non supportée par ce navigateur.', 'position_unavailable');
    }

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      throw new GeolocationError('La géolocalisation nécessite une connexion sécurisée (HTTPS).', 'position_unavailable');
    }

    const requestedHighAccuracy = options.enableHighAccuracy ?? true;
    const requestedTimeout = options.timeout ?? 10000;
    const requestedMaxAge = options.maximumAge ?? 5000;

    // Tentative 1: Position rapide — timeout réduit sur Safari
    try {
      const fast = await this.browserGeoPromise({
        enableHighAccuracy: false,
        timeout: Math.min(requestedTimeout, this.isSafari ? 5000 : 5000),
        maximumAge: Math.max(requestedMaxAge, 10000)
      });
      console.log(`📍 [GPS] Fast fix OK: ±${Math.round(fast.accuracy)}m`);
      
      if (fast.accuracy <= 200 || !requestedHighAccuracy) {
        return fast;
      }
      console.log('📍 [GPS] Fast fix imprécis, tentative précise...');
    } catch (fastError: any) {
      if (fastError instanceof GeolocationError && 
          (fastError.type === 'permission_denied' || fastError.type === 'permission_denied_permanent')) {
        throw fastError;
      }
      console.warn('⚠️ [GPS] Fast fix échoué:', fastError.message, '→ tentative précise...');
    }

    // Tentative 2: Position précise — timeout réduit sur Safari
    const preciseTimeout = this.isSafari 
      ? Math.max(requestedTimeout, 12000)
      : Math.max(requestedTimeout, 12000);

    return this.browserGeoPromise({
      enableHighAccuracy: true,
      timeout: preciseTimeout,
      maximumAge: requestedMaxAge
    });
  }

  /**
   * 🔧 Wrapper promesse pour navigator.geolocation.getCurrentPosition
   * ✅ v5: Paramètre isNativeContext pour forcer messages natifs
   */
  private browserGeoPromise(
    opts: { enableHighAccuracy: boolean; timeout: number; maximumAge: number },
    isNativeContext: boolean = false
  ): Promise<NativeLocationData> {
    // ✅ FIX Safari iOS: Promise.race avec timer manuel
    // Safari ignore parfois le paramètre timeout → l'appel reste suspendu indéfiniment
    const hardTimeout = opts.timeout + 2000; // 2s de marge sur le timeout déclaré

    const geoPromise = new Promise<NativeLocationData>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            source: 'browser'
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            if (isNativeContext || this.isNative) {
              reject(this.createNativePermissionError());
              return;
            }
            
            const isSafariIOS = this.isSafari && /iPhone|iPad/.test(navigator.userAgent);
            const isAndroid = /Android/.test(navigator.userAgent);
            let msg: string;
            let errorType: GeolocationErrorType = 'permission_denied';

            if (isSafariIOS) {
              msg = 'Localisation bloquée sur Safari. Allez dans Réglages iPhone > Confidentialité > Service de localisation > Safari > Autoriser.';
              errorType = 'permission_denied_permanent';
            } else if (isAndroid) {
              msg = 'Localisation bloquée. Appuyez sur l\'icône cadenas (🔒) dans la barre d\'adresse > Autorisations > Localisation > Autoriser.';
              errorType = 'permission_denied_permanent';
            } else {
              msg = 'Permission GPS refusée. Cliquez sur l\'icône cadenas (🔒) > Localisation > Autoriser, puis rechargez la page.';
            }
            reject(new GeolocationError(msg, errorType));
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            const isMobile = /iPhone|iPad|Android/.test(navigator.userAgent);
            const msg = isMobile
              ? 'Position indisponible. Vérifiez que le GPS/Service de localisation est activé dans les Réglages de votre téléphone.'
              : 'Position indisponible. Vérifiez que le GPS est activé.';
            reject(new GeolocationError(msg, 'position_unavailable'));
          } else if (error.code === error.TIMEOUT) {
            reject(new GeolocationError(
              `Le GPS met trop de temps à répondre (>${Math.round(opts.timeout / 1000)}s). Essayez dans un endroit plus ouvert ou vérifiez que le GPS est activé.`,
              'timeout'
            ));
          } else {
            reject(new GeolocationError('Erreur GPS inconnue.', 'unknown'));
          }
        },
        {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: opts.timeout,
          maximumAge: opts.maximumAge
        }
      );
    });

    // ✅ Timer manuel: garantit que la promesse se résout même si Safari ignore le timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new GeolocationError(
          `GPS: pas de réponse après ${Math.round(hardTimeout / 1000)}s. Vérifiez que le GPS est activé.`,
          'timeout'
        ));
      }, hardTimeout);
    });

    return Promise.race([geoPromise, timeoutPromise]);
  }

  async watchPosition(
    callback: (position: NativeLocationData) => void,
    errorCallback?: (error: Error) => void,
    options: NativeGeolocationOptions = {}
  ): Promise<string> {
    const { enableHighAccuracy = true, timeout = 10000, maximumAge = 0 } = options;

    const hasPermission = await this.ensurePermissions();
    if (!hasPermission) {
      errorCallback?.(new Error('Permissions GPS refusées'));
      return '';
    }

    if (this.isNative) {
      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy, timeout, maximumAge },
        (position, err) => {
          if (err) {
            errorCallback?.(new Error(err.message || 'Erreur GPS'));
            return;
          }
          if (position) {
            const locationData: NativeLocationData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              source: 'capacitor'
            };
            this.lastKnownPosition = locationData;
            callback(locationData);
          }
        }
      );
      return watchId;
    } else {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: NativeLocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            source: 'browser'
          };
          this.lastKnownPosition = locationData;
          callback(locationData);
        },
        (error) => {
          errorCallback?.(new Error(error.message));
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
      return String(watchId);
    }
  }

  async clearWatch(watchId: string): Promise<void> {
    if (this.isNative) {
      await Geolocation.clearWatch({ id: watchId });
    } else {
      navigator.geolocation.clearWatch(Number(watchId));
    }
  }

  getLastKnownPosition(): NativeLocationData | null {
    return this.lastKnownPosition;
  }

  isNativePlatform(): boolean {
    return this.isNative;
  }

  async openAppSettings(): Promise<boolean> {
    if (this.isNative) {
      try {
        const platform = Capacitor.getPlatform();
        if (platform === 'ios') {
          window.open('app-settings:', '_system');
          console.log('📍 [GPS] Opened iOS app settings');
          return true;
        }
        if (platform === 'android') {
          // ✅ v5: Try to use Capacitor App plugin if available for Android
          // Some versions of Capacitor allow opening settings via specialized plugins.
          // Fallback to manual guidance if this fails.
          try {
            const nsPkg = 'capacitor' + '-native-settings';
            const { NativeSettings, AndroidSettings } = await import(/* @vite-ignore */ nsPkg);
            await NativeSettings.open({
              option: AndroidSettings.ApplicationDetails,
            });
            return true;
          } catch {
            console.log('📍 [GPS] Android: capacitor-native-settings not available, showing guidance');
            return false;
          }
        }
        return false;
      } catch (e) {
        console.warn('⚠️ Cannot open settings programmatically:', e);
      }
    }
    return false;
  }

  getSettingsGuidance(): { platform: string; steps: string; detailedSteps: string[] } {
    const ua = navigator.userAgent;
    const isAndroid = /Android/.test(ua);
    const isIOS = /iPhone|iPad/.test(ua);

    if (this.isNative && isAndroid) {
      return {
        platform: 'android',
        steps: 'Paramètres > Applications > TAGA > Permissions > Localisation > Autoriser',
        detailedSteps: [
          'Ouvrez les Paramètres de votre téléphone',
          'Allez dans Applications > TAGA',
          'Appuyez sur Permissions > Localisation',
          'Sélectionnez "Autoriser tout le temps" ou "Uniquement pendant l\'utilisation"',
          'Activez aussi "Utiliser la position précise"'
        ]
      };
    }
    if (this.isNative && isIOS) {
      return {
        platform: 'ios',
        steps: 'Réglages > Confidentialité > Service de localisation > TAGA > Lorsque l\'app est active',
        detailedSteps: [
          'Ouvrez les Réglages iPhone',
          'Allez dans Confidentialité et sécurité > Service de localisation',
          'Vérifiez que le Service de localisation est ACTIVÉ (en haut)',
          'Trouvez TAGA dans la liste',
          'Sélectionnez "Lorsque l\'app est active" ou "Toujours"',
          'Activez "Position exacte"'
        ]
      };
    }
    if (this.isSafari && isIOS) {
      return {
        platform: 'safari-ios',
        steps: 'Réglages iPhone > Confidentialité > Service de localisation > Safari > Autoriser',
        detailedSteps: [
          'Ouvrez les Réglages iPhone',
          'Allez dans Confidentialité et sécurité > Service de localisation',
          'Vérifiez que le Service de localisation est ACTIVÉ',
          'Trouvez Safari dans la liste et appuyez dessus',
          'Sélectionnez "Lorsque l\'app est active" ou "Autoriser"',
          'Retournez sur TAGA et rechargez la page'
        ]
      };
    }
    if (isAndroid) {
      return {
        platform: 'android-web',
        steps: 'Appuyez sur le cadenas 🔒 > Autorisations > Localisation > Autoriser',
        detailedSteps: [
          'Appuyez sur l\'icône cadenas (🔒) dans la barre d\'adresse',
          'Appuyez sur "Autorisations" ou "Paramètres du site"',
          'Activez "Localisation"',
          'Rechargez la page',
          'Si ça ne marche pas : Paramètres téléphone > Localisation > activez le GPS'
        ]
      };
    }
    return {
      platform: 'web',
      steps: 'Cliquez sur l\'icône cadenas 🔒 > Localisation > Autoriser',
      detailedSteps: [
        'Cliquez sur l\'icône cadenas (🔒) à gauche de la barre d\'adresse',
        'Trouvez "Localisation" dans les permissions',
        'Changez de "Bloquer" à "Autoriser"',
        'Rechargez la page'
      ]
    };
  }
}

// 🛡️ Safe singleton via Proxy — never crash at module evaluation or on method calls
let _nativeInstance: NativeGeolocationService | null = null;
try { _nativeInstance = new NativeGeolocationService(); }
catch (e) { console.error('❌ NativeGeolocationService init failed:', e); }

export const nativeGeolocationService = new Proxy({} as NativeGeolocationService, {
  get(_target, prop: string) {
    if (_nativeInstance) {
      const val = (_nativeInstance as any)[prop];
      return typeof val === 'function' ? val.bind(_nativeInstance) : val;
    }
    // Safe fallbacks when instance failed to init
    if (prop === 'getCurrentPosition' || prop === 'getPreciseInitialPosition')
      return () => Promise.reject(new Error('GPS service unavailable'));
    if (prop === 'isNativePlatform') return () => false;
    if (prop === 'checkPermissions')
      return () => Promise.resolve({ location: 'prompt', coarseLocation: 'prompt' });
    if (prop === 'getPermissionInstructions')
      return () => ({ platform: 'web', steps: 'GPS unavailable', detailedSteps: [] });
    return () => {};
  }
});
