/**
 * 🎯 PHASE 2: Service de routage intelligent des notifications
 * 
 * Les notifications sont filtrées côté SERVEUR via l'Edge Function driver-notification-router
 * Ce service simplifie l'écoute côté client car les notifications arrivent déjà filtrées
 */

import { supabase } from '@/integrations/supabase/client';

export interface RouteNotificationRequest {
  orderType: 'taxi' | 'delivery' | 'marketplace';
  orderId: string;
  orderData: any;
  targetRadius?: number;
  pickupLat?: number;
  pickupLng?: number;
}

/**
 * Route une nouvelle commande vers les chauffeurs appropriés
 * La validation du service_type est faite côté serveur
 */
export async function routeNotificationToDrivers(request: RouteNotificationRequest): Promise<{
  success: boolean;
  notifiedCount: number;
  error?: string;
}> {
  try {
    console.log(`📡 Routing ${request.orderType} order ${request.orderId} via server`);

    const { data, error } = await supabase.functions.invoke('driver-notification-router', {
      body: {
        orderType: request.orderType,
        orderId: request.orderId,
        orderData: request.orderData,
        targetRadius: request.targetRadius || 10,
        pickupLat: request.pickupLat,
        pickupLng: request.pickupLng
      }
    });

    if (error) {
      console.error('❌ Error routing notification:', error);
      return {
        success: false,
        notifiedCount: 0,
        error: error.message
      };
    }

    console.log(`✅ Successfully routed to ${data.notifiedCount} drivers`);

    return {
      success: true,
      notifiedCount: data.notifiedCount
    };

  } catch (error: any) {
    console.error('💥 Failed to route notification:', error);
    return {
      success: false,
      notifiedCount: 0,
      error: error.message
    };
  }
}

/**
 * Valide qu'un chauffeur peut accepter un certain type de commande
 * Utilisé avant l'acceptation côté client pour une double validation
 */
export async function validateDriverServiceType(
  driverId: string,
  orderType: 'taxi' | 'delivery' | 'marketplace',
  orderId: string
): Promise<{
  valid: boolean;
  reason: string;
  driverServiceType?: string;
}> {
  try {
    console.log(`🔍 Validating driver ${driverId} for ${orderType} order`);

    const { data, error } = await supabase.functions.invoke('validate-driver-service-type', {
      body: {
        driverId,
        orderType,
        orderId
      }
    });

    if (error) {
      console.error('❌ Validation error:', error);
      return {
        valid: false,
        reason: error.message
      };
    }

    console.log(`${data.valid ? '✅' : '❌'} Validation: ${data.reason}`);

    return {
      valid: data.valid,
      reason: data.reason,
      driverServiceType: data.driverServiceType
    };

  } catch (error: any) {
    console.error('💥 Validation failed:', error);
    return {
      valid: false,
      reason: `Validation error: ${error.message}`
    };
  }
}

/**
 * Helper: Récupère le service_type d'un chauffeur directement
 */
export async function getDriverServiceType(driverId: string): Promise<'taxi' | 'delivery' | null> {
  try {
    const { data, error } = await (supabase as any)
      .rpc('get_driver_service_type', { driver_user_id: driverId });

    if (error) {
      console.error('❌ Error fetching service type:', error);
      return null;
    }

    return data as 'taxi' | 'delivery';
  } catch (error) {
    console.error('💥 Failed to get service type:', error);
    return null;
  }
}
