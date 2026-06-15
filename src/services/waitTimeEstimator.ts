/**
 * ⏱️ WAIT TIME ESTIMATOR - Phase 3
 * Estime le délai d'attente pour obtenir un chauffeur
 * Basé sur disponibilité en temps réel + historique
 */

import { supabase } from '@/integrations/supabase/client';

interface WaitTimeEstimate {
  estimated: number | null; // en minutes
  confidence: 'low' | 'medium' | 'high';
  driversAvailable: number;
  message: string;
}

export class WaitTimeEstimatorService {
  /**
   * Compte les chauffeurs disponibles à proximité
   */
  private async getNearbyDriversCount(
    location: { lat: number; lng: number },
    radius: number = 5
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('driver_locations')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .eq('is_available', true)
        .gte('last_ping', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ [WaitTimeEstimator] Error counting drivers:', error);
      return 0;
    }
  }

  /**
   * Récupère le temps d'assignation moyen récent
   */
  private async getAverageAssignmentTime(city: string): Promise<number> {
    try {
      // Dernières 50 courses terminées dans la ville
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('created_at, updated_at')
        .ilike('city', city)
        .in('status', ['driver_assigned', 'pickup', 'in_progress', 'completed'])
        .not('driver_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data || data.length === 0) return 5; // Fallback 5 minutes

      // Calculer le temps moyen entre création et assignation
      const times = data
        .map(booking => {
          const created = new Date(booking.created_at).getTime();
          const assigned = new Date(booking.updated_at).getTime();
          return (assigned - created) / 1000 / 60; // en minutes
        })
        .filter(time => time > 0 && time < 30); // Filtrer les valeurs aberrantes

      if (times.length === 0) return 5;

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      return Math.round(avgTime);
    } catch (error) {
      console.error('❌ [WaitTimeEstimator] Error getting avg time:', error);
      return 5; // Fallback
    }
  }

  /**
   * Estime le temps d'attente
   */
  async estimateWaitTime(
    location: { lat: number; lng: number },
    city: string = 'Kinshasa'
  ): Promise<WaitTimeEstimate> {
    try {
      console.log('⏱️ [WaitTimeEstimator] Estimating wait time for', city);

      // 1. Compter les chauffeurs disponibles
      const driversCount = await this.getNearbyDriversCount(location);
      console.log(`👥 [WaitTimeEstimator] ${driversCount} drivers available`);

      // 2. Récupérer le temps moyen d'assignation
      const avgAssignmentTime = await this.getAverageAssignmentTime(city);
      console.log(`📊 [WaitTimeEstimator] Avg assignment time: ${avgAssignmentTime}min`);

      // 3. Calculer l'estimation
      if (driversCount === 0) {
        return {
          estimated: null,
          confidence: 'low',
          driversAvailable: 0,
          message: 'Aucun chauffeur disponible actuellement'
        };
      }

      if (driversCount >= 5) {
        return {
          estimated: 2,
          confidence: 'high',
          driversAvailable: driversCount,
          message: `${driversCount} chauffeurs disponibles - Environ 2 minutes`
        };
      }

      if (driversCount >= 2) {
        return {
          estimated: Math.round(avgAssignmentTime / 2),
          confidence: 'medium',
          driversAvailable: driversCount,
          message: `${driversCount} chauffeurs disponibles - Environ ${Math.round(avgAssignmentTime / 2)} minutes`
        };
      }

      // 1 chauffeur seulement
      return {
        estimated: avgAssignmentTime,
        confidence: 'low',
        driversAvailable: 1,
        message: `1 chauffeur disponible - Environ ${avgAssignmentTime} minutes`
      };

    } catch (error) {
      console.error('❌ [WaitTimeEstimator] Error:', error);
      return {
        estimated: null,
        confidence: 'low',
        driversAvailable: 0,
        message: 'Impossible d\'estimer le temps d\'attente'
      };
    }
  }

  /**
   * Estime par heure de la journée (pour affichage prédictif)
   */
  async estimateByTimeOfDay(city: string = 'Kinshasa'): Promise<Record<number, number>> {
    try {
      const estimates: Record<number, number> = {};
      
      // Pour l'instant, on retourne des estimations statiques
      // Dans une version avancée, on analyserait l'historique par heure
      const baseTime = 3;
      const rushHours = [7, 8, 9, 17, 18, 19];
      
      for (let hour = 0; hour < 24; hour++) {
        if (rushHours.includes(hour)) {
          estimates[hour] = baseTime * 2; // 2x plus long aux heures de pointe
        } else {
          estimates[hour] = baseTime;
        }
      }

      return estimates;
    } catch (error) {
      console.error('❌ [WaitTimeEstimator] Error estimating by time:', error);
      return {};
    }
  }
}

// Instance singleton
export const waitTimeEstimator = new WaitTimeEstimatorService();
