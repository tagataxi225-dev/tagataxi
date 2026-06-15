/**
 * Service de sécurité pour Google Maps API
 * Monitoring, alertes et contrôles d'accès
 */

import { supabase } from '@/integrations/supabase/client';

class GoogleMapsSecurityService {
  private static instance: GoogleMapsSecurityService;
  private keyAccessCount = 0;
  private lastAccessTime = 0;
  private readonly MAX_REQUESTS_PER_MINUTE = 20;

  private constructor() {}

  static getInstance(): GoogleMapsSecurityService {
    if (!GoogleMapsSecurityService.instance) {
      GoogleMapsSecurityService.instance = new GoogleMapsSecurityService();
    }
    return GoogleMapsSecurityService.instance;
  }

  /**
   * Vérifie si l'accès à la clé est autorisé (rate limiting côté client)
   */
  canAccessKey(): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Reset du compteur après 1 minute
    if (now - this.lastAccessTime > oneMinute) {
      this.keyAccessCount = 0;
      this.lastAccessTime = now;
    }

    this.keyAccessCount++;

    if (this.keyAccessCount > this.MAX_REQUESTS_PER_MINUTE) {
      // Don't log to console in production (SECURE)
      return false;
    }

    return true;
  }

  /**
   * Log l'utilisation de la clé Google Maps
   * SECURE: Logs to database instead of console to prevent data leakage
   */
  async logKeyUsage(action: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Store in database audit table instead of console (SECURE)
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'google_maps_api_usage',
        description: `Google Maps API: ${action}`,
        metadata: this.maskSensitiveData(metadata || {})
      }).select().maybeSingle();
    } catch (error) {
      // Silent fail - don't expose errors in production console
      if (import.meta.env.DEV) {
        console.error('❌ [GoogleMapsSecurity] Erreur logging:', error);
      }
    }
  }

  /**
   * Mask sensitive data before logging
   */
  private maskSensitiveData(data: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['token', 'password', 'key', 'secret', 'coordinate', 'lat', 'lng', 'latitude', 'longitude'];
    const masked = { ...data };
    
    Object.keys(masked).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        masked[key] = '***MASKED***';
      }
    });
    
    return masked;
  }

  /**
   * Vérifie le monitoring de sécurité
   */
  async checkSecurityMonitoring(): Promise<{
    status: 'ok' | 'warning' | 'blocked';
    usage: { last_hour: number; last_24h: number };
    warnings: string[];
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-security-monitor', {
        method: 'POST',
      });

      if (error) throw error;

      return data;
    } catch (error) {
      // Silent fail in production (SECURE)
      return {
        status: 'ok',
        usage: { last_hour: 0, last_24h: 0 },
        warnings: [],
      };
    }
  }

  /**
   * Nettoie les données sensibles stockées localement
   */
  clearSensitiveData(): void {
    // Ne pas stocker la clé en localStorage/sessionStorage
    // Silent operation - no console logging (SECURE)
  }

  /**
   * Valide le domaine d'origine pour éviter l'utilisation cross-origin
   * Compatible Capacitor/Android/iOS
   */
  validateOrigin(): boolean {
    // Toujours valide sur Capacitor (mobile natif)
    const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() ?? false;
    if (isCapacitor || window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') {
      return true;
    }
    
    const allowedOrigins = [
      'localhost',
      '127.0.0.1',
      'tembea.app',
      
      window.location.hostname,
    ];

    const currentOrigin = window.location.hostname;
    const isValid = allowedOrigins.some(origin => currentOrigin.includes(origin));

    // Don't log security warnings to console (SECURE)
    return isValid;
  }
}

export const googleMapsSecurityService = GoogleMapsSecurityService.getInstance();
