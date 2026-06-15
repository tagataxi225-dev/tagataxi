import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

/**
 * Utilitaire de debug pour diagnostiquer les problèmes de réservation
 * Utilise les RPCs sécurisés au lieu de SELECT directs (respect des RLS)
 */
export class DebugHelper {
  
  static async checkDriversAvailability() {
    logger.debug('Vérification disponibilité chauffeurs via RPC');
    
    try {
      // ✅ Utiliser le RPC sécurisé avec les paramètres p_ préfixés
      const { data: drivers, error } = await supabase.rpc('find_nearby_drivers', {
        p_lat: -4.3217,  // Kinshasa par défaut
        p_lng: 15.3069,
        p_max_distance_km: 50,  // Large radius pour diagnostic
        p_service_type: 'taxi'
      });

      if (error) {
        logger.error('Erreur RPC find_nearby_drivers', error);
        return null;
      }

      logger.debug(`${drivers?.length || 0} chauffeurs disponibles`, drivers);
      
      return {
        totalOnline: drivers?.length || 0,
        drivers: drivers || []
      };
    } catch (error) {
      logger.error('Erreur générale checkDriversAvailability', error);
      return null;
    }
  }

  static async checkRecentBookings() {
    logger.debug('Vérification réservations récentes');
    
    try {
      const { data: recentBookings, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Erreur récupération réservations', error);
        return null;
      }

      logger.debug(`${recentBookings?.length || 0} réservations récentes`, recentBookings);
      
      return recentBookings || [];
    } catch (error) {
      logger.error('Erreur générale checkRecentBookings', error);
      return null;
    }
  }

  static async checkRecentDeliveries() {
    logger.debug('Vérification livraisons récentes');
    
    try {
      const { data: recentDeliveries, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Erreur récupération livraisons', error);
        return null;
      }

      logger.debug(`${recentDeliveries?.length || 0} livraisons récentes`, recentDeliveries);
      
      return recentDeliveries || [];
    } catch (error) {
      logger.error('Erreur générale checkRecentDeliveries', error);
      return null;
    }
  }

  static async testEdgeFunctionConnection() {
    logger.debug('Test connexion Edge Functions');
    
    try {
      logger.debug('Edge function tests skipped - use real UI flow instead');
      return {
        rideDispatcher: { skipped: true },
        deliveryDispatcher: { skipped: true }
      };
    } catch (error) {
      logger.error('Erreur test Edge Functions', error);
      return null;
    }
  }

  static async runFullDiagnostic() {
    logger.debug('=== DIAGNOSTIC COMPLET DÉMARRÉ ===');
    
    const results = {
      drivers: await this.checkDriversAvailability(),
      bookings: await this.checkRecentBookings(),
      deliveries: await this.checkRecentDeliveries(),
      edgeFunctions: await this.testEdgeFunctionConnection()
    };

    logger.debug('=== RÉSULTATS DIAGNOSTIC ===', results);
    
    return results;
  }
}

// Exposer globalement pour debug dans la console
if (typeof window !== 'undefined') {
  (window as any).debugTembea = DebugHelper;
}
