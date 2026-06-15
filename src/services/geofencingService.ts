import { supabase } from '@/integrations/supabase/client';
import { ZoneService, ServiceZone } from './zoneService';

export interface GeofenceEvent {
  id: string;
  userId: string;
  type: 'enter' | 'exit' | 'dwell';
  zone: ServiceZone;
  location: { lat: number; lng: number };
  timestamp: Date;
  metadata?: any;
}

export class GeofencingService {
  private static activeGeofences = new Map<string, ServiceZone>();
  private static listeners = new Set<(event: GeofenceEvent) => void>();

  static addListener(callback: (event: GeofenceEvent) => void) {
    this.listeners.add(callback);
  }

  static removeListener(callback: (event: GeofenceEvent) => void) {
    this.listeners.delete(callback);
  }

  static async checkGeofences(
    userId: string,
    lat: number,
    lng: number,
    previousLat?: number,
    previousLng?: number
  ) {
    const currentZone = ZoneService.getZoneByPoint(lng, lat);
    const previousZone = previousLat && previousLng ? 
      ZoneService.getZoneByPoint(previousLng, previousLat) : null;

    // Zone transition detected
    if (currentZone?.id !== previousZone?.id) {
      const events: GeofenceEvent[] = [];

      // Exit event
      if (previousZone) {
        const exitEvent: GeofenceEvent = {
          id: `exit_${previousZone.id}_${Date.now()}`,
          userId,
          type: 'exit',
          zone: previousZone,
          location: { lat, lng },
          timestamp: new Date(),
          metadata: { surgeMultiplier: previousZone.surgeMultiplier }
        };
        events.push(exitEvent);
        this.logGeofenceEvent(exitEvent);
      }

      // Enter event
      if (currentZone) {
        const enterEvent: GeofenceEvent = {
          id: `enter_${currentZone.id}_${Date.now()}`,
          userId,
          type: 'enter',
          zone: currentZone,
          location: { lat, lng },
          timestamp: new Date(),
          metadata: { surgeMultiplier: currentZone.surgeMultiplier }
        };
        events.push(enterEvent);
        this.logGeofenceEvent(enterEvent);
      }

      // Notify listeners
      events.forEach(event => {
        this.listeners.forEach(listener => listener(event));
      });

      return events;
    }

    return [];
  }

  private static async logGeofenceEvent(event: GeofenceEvent) {
    try {
      await supabase.from('activity_logs').insert({
        user_id: event.userId,
        activity_type: `geofence_${event.type}`,
        description: `${event.type === 'enter' ? 'Entrée' : 'Sortie'} zone ${event.zone.name}`,
        metadata: {
          zone: event.zone,
          location: event.location,
          ...event.metadata
        }
      });
    } catch (error) {
      console.error('Error logging geofence event:', error);
    }
  }
}