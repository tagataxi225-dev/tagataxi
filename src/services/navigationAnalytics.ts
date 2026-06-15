/**
 * 📊 Service d'Analytics pour Navigation GPS
 * Tracking des métriques et performances de navigation
 */

import { supabase } from '@/integrations/supabase/client';

export interface NavigationSession {
  id?: string;
  driver_id: string;
  order_id: string;
  order_type: 'transport' | 'delivery';
  pickup_coords: { lat: number; lng: number };
  destination_coords: { lat: number; lng: number };
  distance_km?: number;
  estimated_duration_minutes?: number;
  device_info?: {
    userAgent: string;
    platform: string;
    online: boolean;
  };
  network_type?: string;
  battery_level?: number;
}

export interface NavigationEvent {
  session_id: string;
  event_type: 'session_started' | 'navigation_started' | 'off_route_detected' | 
               'route_recalculated' | 'voice_instruction' | 'location_update' | 
               'arrived_at_destination' | 'session_ended' | 'error';
  event_data?: any;
  location_coords?: { lat: number; lng: number };
}

class NavigationAnalyticsService {
  private currentSessionId: string | null = null;

  /**
   * Démarre une session de navigation
   */
  async startSession(sessionData: NavigationSession): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return null;
      }

      // Récupérer infos device
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        online: navigator.onLine
      };

      // Récupérer niveau batterie si disponible
      let batteryLevel: number | undefined;
      if ('getBattery' in navigator) {
        try {
          const battery: any = await (navigator as any).getBattery();
          batteryLevel = Math.round(battery.level * 100);
        } catch (e) {
          console.log('Battery API not available');
        }
      }

      // Récupérer type de connexion
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const networkType = connection?.effectiveType || 'unknown';

      const { data, error } = await supabase
        .from('navigation_sessions')
        .insert({
          driver_id: user.id,
          order_id: sessionData.order_id,
          order_type: sessionData.order_type,
          pickup_coords: sessionData.pickup_coords,
          destination_coords: sessionData.destination_coords,
          distance_km: sessionData.distance_km,
          estimated_duration_minutes: sessionData.estimated_duration_minutes,
          device_info: deviceInfo,
          network_type: networkType,
          battery_level: batteryLevel,
          status: 'active'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to start navigation session:', error);
        return null;
      }

      this.currentSessionId = data.id;
      console.log('📊 Navigation session started:', data.id);

      // Log événement de démarrage
      await this.logEvent({
        session_id: data.id,
        event_type: 'session_started',
        event_data: { ...sessionData }
      });

      return data.id;
    } catch (error) {
      console.error('Error starting navigation session:', error);
      return null;
    }
  }

  /**
   * Log un événement de navigation
   */
  async logEvent(event: NavigationEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('navigation_events')
        .insert({
          session_id: event.session_id,
          event_type: event.event_type,
          event_data: event.event_data,
          location_coords: event.location_coords
        });

      if (error) {
        console.error('Failed to log navigation event:', error);
      }
    } catch (error) {
      console.error('Error logging navigation event:', error);
    }
  }

  /**
   * Incrémente un compteur (off_route, recalculations, voice_instructions)
   */
  async incrementCounter(
    sessionId: string, 
    counter: 'off_route_count' | 'recalculations_count' | 'voice_instructions_count'
  ): Promise<void> {
    try {
      // Récupérer valeur actuelle et incrémenter
      const { data: session } = await supabase
        .from('navigation_sessions')
        .select(counter)
        .eq('id', sessionId)
        .single();

      if (session) {
        await supabase
          .from('navigation_sessions')
          .update({ [counter]: (session[counter] || 0) + 1 })
          .eq('id', sessionId);
      }
    } catch (error) {
      console.error(`Error incrementing ${counter}:`, error);
    }
  }

  /**
   * Termine une session de navigation
   */
  async endSession(
    sessionId: string, 
    status: 'completed' | 'cancelled' | 'error',
    completionStatus?: 'arrived' | 'cancelled_by_driver' | 'cancelled_by_customer' | 'error',
    actualDurationMinutes?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('navigation_sessions')
        .update({
          status,
          completion_status: completionStatus,
          actual_duration_minutes: actualDurationMinutes,
          ended_at: new Date().toISOString(),
          duration_seconds: actualDurationMinutes ? actualDurationMinutes * 60 : null
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Failed to end navigation session:', error);
        return;
      }

      console.log('📊 Navigation session ended:', sessionId);

      // Log événement de fin
      await this.logEvent({
        session_id: sessionId,
        event_type: 'session_ended',
        event_data: { status, completionStatus, actualDurationMinutes }
      });

      if (this.currentSessionId === sessionId) {
        this.currentSessionId = null;
      }
    } catch (error) {
      console.error('Error ending navigation session:', error);
    }
  }

  /**
   * Log une erreur de navigation
   */
  async logError(sessionId: string, errorType: string, errorMessage: string, errorData?: any): Promise<void> {
    try {
      await this.logEvent({
        session_id: sessionId,
        event_type: 'error',
        event_data: {
          errorType,
          errorMessage,
          errorData,
          timestamp: new Date().toISOString()
        }
      });

      // Mettre à jour la session avec l'erreur
      await supabase
        .from('navigation_sessions')
        .update({
          navigation_errors: {
            type: errorType,
            message: errorMessage,
            data: errorData
          }
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error logging navigation error:', error);
    }
  }

  /**
   * Récupère les stats quotidiennes
   */
  async getDailyStats(date?: Date): Promise<any> {
    try {
      const targetDate = date || new Date();
      const dateString = targetDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('navigation_stats_daily')
        .select('*')
        .eq('stats_date', dateString)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Failed to fetch daily stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      return null;
    }
  }

  /**
   * Récupère l'historique des sessions du chauffeur
   */
  async getDriverSessions(limit: number = 10): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('navigation_sessions')
        .select('*')
        .eq('driver_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch driver sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching driver sessions:', error);
      return [];
    }
  }

  /**
   * Récupère la session courante
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}

export const navigationAnalytics = new NavigationAnalyticsService();
