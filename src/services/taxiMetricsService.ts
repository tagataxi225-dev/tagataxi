/**
 * 📊 TAXI METRICS SERVICE - Phase 4
 * Tracking détaillé de toutes les métriques du service taxi
 * Pour analytics et optimisation continue
 */

import { supabase } from '@/integrations/supabase/client';

type TaxiMetricEvent =
  | 'booking_started'
  | 'vehicle_selected'
  | 'destination_entered'
  | 'price_calculated'
  | 'dispatch_attempt'
  | 'dispatch_success'
  | 'dispatch_failed'
  | 'driver_assigned'
  | 'driver_arrived'
  | 'trip_started'
  | 'trip_completed'
  | 'trip_cancelled'
  | 'payment_completed'
  | 'rating_submitted';

interface MetricData {
  event_type: TaxiMetricEvent;
  user_id?: string;
  booking_id?: string;
  driver_id?: string;
  [key: string]: any;
}

export class TaxiMetricsService {
  /**
   * Enregistre un événement métrique
   */
  async logEvent(data: MetricData): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const metricEntry = {
        ...data,
        user_id: data.user_id || user?.id,
        timestamp: new Date().toISOString(),
        session_id: this.getSessionId()
      };

      // Log to console for now (will be migrated to DB later)
      console.log(`📊 [TaxiMetrics] ${data.event_type}`, metricEntry);
      
      // Store in localStorage for client-side analytics
      this.storeLocalMetric(metricEntry);
    } catch (error) {
      console.error('❌ [TaxiMetrics] Exception:', error);
    }
  }

  /**
   * Stocke la métrique localement
   */
  private storeLocalMetric(metric: any): void {
    try {
      const key = 'taxi_metrics';
      const existing = localStorage.getItem(key);
      const metrics = existing ? JSON.parse(existing) : [];
      
      metrics.push(metric);
      
      // Garder seulement les 100 dernières métriques
      if (metrics.length > 100) {
        metrics.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(metrics));
    } catch (error) {
      console.error('❌ [TaxiMetrics] Error storing local metric:', error);
    }
  }

  /**
   * Obtient ou crée un ID de session
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('taxi_session_id');
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('taxi_session_id', sessionId);
    }
    
    return sessionId;
  }

  // ========== ÉVÉNEMENTS SPÉCIFIQUES ==========

  async logBookingStarted(data: {
    pickup: { lat: number; lng: number };
    city: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'booking_started',
      pickup_lat: data.pickup.lat,
      pickup_lng: data.pickup.lng,
      city: data.city
    });
  }

  async logVehicleSelected(data: {
    vehicle_type: string;
    estimated_price: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'vehicle_selected',
      vehicle_type: data.vehicle_type,
      estimated_price: data.estimated_price
    });
  }

  async logDestinationEntered(data: {
    destination: string;
    distance_km: number;
    duration_seconds: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'destination_entered',
      destination: data.destination,
      distance_km: data.distance_km,
      duration_seconds: data.duration_seconds
    });
  }

  async logDispatchAttempt(data: {
    booking_id: string;
    vehicle_type: string;
    search_radius: number;
    priority: string;
    timestamp_start: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'dispatch_attempt',
      booking_id: data.booking_id,
      vehicle_type: data.vehicle_type,
      search_radius: data.search_radius,
      priority: data.priority,
      timestamp_start: data.timestamp_start
    });
  }

  async logDispatchSuccess(data: {
    booking_id: string;
    driver_id: string;
    drivers_found: number;
    search_radius: number;
    duration_ms: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'dispatch_success',
      booking_id: data.booking_id,
      driver_id: data.driver_id,
      drivers_found: data.drivers_found,
      search_radius: data.search_radius,
      duration_ms: data.duration_ms
    });
  }

  async logDispatchFailed(data: {
    booking_id: string;
    reason: string;
    drivers_found: number;
    search_radius: number;
    duration_ms: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'dispatch_failed',
      booking_id: data.booking_id,
      reason: data.reason,
      drivers_found: data.drivers_found,
      search_radius: data.search_radius,
      duration_ms: data.duration_ms
    });
  }

  async logDriverAssigned(data: {
    booking_id: string;
    driver_id: string;
    time_to_assign_seconds: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'driver_assigned',
      booking_id: data.booking_id,
      driver_id: data.driver_id,
      time_to_assign_seconds: data.time_to_assign_seconds
    });
  }

  async logTripCompleted(data: {
    booking_id: string;
    driver_id: string;
    actual_price: number;
    actual_distance_km: number;
    actual_duration_minutes: number;
    payment_method: string;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'trip_completed',
      booking_id: data.booking_id,
      driver_id: data.driver_id,
      actual_price: data.actual_price,
      actual_distance_km: data.actual_distance_km,
      actual_duration_minutes: data.actual_duration_minutes,
      payment_method: data.payment_method
    });
  }

  async logTripCancelled(data: {
    booking_id: string;
    cancelled_by: 'client' | 'driver' | 'system';
    reason: string;
    time_to_cancel_seconds: number;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'trip_cancelled',
      booking_id: data.booking_id,
      cancelled_by: data.cancelled_by,
      reason: data.reason,
      time_to_cancel_seconds: data.time_to_cancel_seconds
    });
  }

  /**
   * Récupère les métriques pour un dashboard depuis localStorage
   */
  async getMetricsSummary(period: 'today' | 'week' | 'month' = 'today') {
    try {
      const key = 'taxi_metrics';
      const existing = localStorage.getItem(key);
      if (!existing) {
        return {
          total_bookings: 0,
          successful_dispatches: 0,
          failed_dispatches: 0,
          completed_trips: 0,
          cancelled_trips: 0,
          avg_dispatch_time: 0,
          conversion_rate: 0
        };
      }

      const metrics = JSON.parse(existing);

      // Filtrer par période
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      const filteredMetrics = metrics.filter((m: any) => 
        new Date(m.timestamp) >= startDate
      );

      // Calcul des statistiques
      const summary = {
        total_bookings: filteredMetrics.filter((m: any) => m.event_type === 'booking_started').length,
        successful_dispatches: filteredMetrics.filter((m: any) => m.event_type === 'dispatch_success').length,
        failed_dispatches: filteredMetrics.filter((m: any) => m.event_type === 'dispatch_failed').length,
        completed_trips: filteredMetrics.filter((m: any) => m.event_type === 'trip_completed').length,
        cancelled_trips: filteredMetrics.filter((m: any) => m.event_type === 'trip_cancelled').length,
        avg_dispatch_time: this.calculateAvgDispatchTime(filteredMetrics),
        conversion_rate: this.calculateConversionRate(filteredMetrics)
      };

      return summary;
    } catch (error) {
      console.error('❌ [TaxiMetrics] Error getting summary:', error);
      return null;
    }
  }

  private calculateAvgDispatchTime(metrics: any[]): number {
    const dispatchMetrics = metrics.filter(m => m.event_type === 'dispatch_success');
    if (dispatchMetrics.length === 0) return 0;

    const totalTime = dispatchMetrics.reduce((sum, m) => sum + (m.duration_ms || 0), 0);
    return Math.round(totalTime / dispatchMetrics.length / 1000); // en secondes
  }

  private calculateConversionRate(metrics: any[]): number {
    const started = metrics.filter(m => m.event_type === 'booking_started').length;
    const completed = metrics.filter(m => m.event_type === 'trip_completed').length;
    
    if (started === 0) return 0;
    return Math.round((completed / started) * 100);
  }
}

// Instance singleton
export const taxiMetrics = new TaxiMetricsService();
