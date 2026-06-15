import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { secureLog } from './secureLogger';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = i === maxRetries - 1;
      const isConnectionError = error?.message?.includes('upstream connect error') || 
                                error?.message?.includes('connection') ||
                                error?.code === 'ECONNREFUSED';
      
      if (isLastAttempt || !isConnectionError) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      secureLog.warn(`Tentative ${i + 1}/${maxRetries} échouée, retry dans ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries reached');
};

export const cleanupOldPendingOrders = async () => {
  try {
    secureLog.info('🧹 Nettoyage des anciennes commandes pending...');
    
    let totalCleaned = 0;

    // Nettoyer les commandes de transport avec retry
    try {
      const result = await retryWithBackoff(async () => {
        return await supabase
          .from('transport_bookings')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('status', 'pending')
          .is('driver_id', null)
          .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
          .select('id');
      });

      if (result.error) {
        secureLog.error('Erreur nettoyage transport:', result.error);
      } else {
        const count = result.data?.length || 0;
        totalCleaned += count;
        secureLog.info(`✅ ${count} anciennes réservations taxi nettoyées`);
      }
    } catch (error: any) {
      secureLog.error('Échec nettoyage transport après retries:', error?.message);
    }

    // Nettoyer les commandes de livraison avec retry
    try {
      const result = await retryWithBackoff(async () => {
        return await supabase
          .from('delivery_orders')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('status', 'pending')
          .is('driver_id', null)
          .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
          .select('id');
      });

      if (result.error) {
        secureLog.error('Erreur nettoyage livraison:', result.error);
      } else {
        const count = result.data?.length || 0;
        totalCleaned += count;
        secureLog.info(`✅ ${count} anciennes commandes livraison nettoyées`);
      }
    } catch (error: any) {
      secureLog.error('Échec nettoyage livraison après retries:', error?.message);
    }
    
    if (totalCleaned > 0) {
      toast.success(`${totalCleaned} anciennes commandes nettoyées`);
    }

    return totalCleaned;
  } catch (error: any) {
    secureLog.error('Erreur critique lors du nettoyage:', error);
    return 0;
  }
};

export const validateOrderCoordinates = (coordinates: any): boolean => {
  if (!coordinates || typeof coordinates !== 'object') {
    return false;
  }

  const { lat, lng } = coordinates;
  
  // Vérifier que les coordonnées sont des nombres valides
  const latNum = typeof lat === 'number' ? lat : parseFloat(lat);
  const lngNum = typeof lng === 'number' ? lng : parseFloat(lng);
  
  if (isNaN(latNum) || isNaN(lngNum)) {
    return false;
  }

  // Vérifier que les coordonnées sont dans des plages réalistes
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return false;
  }

  // Vérifier que ce ne sont pas des coordonnées nulles
  if (latNum === 0 && lngNum === 0) {
    return false;
  }

  return true;
};

export const getOrderStatusMessage = (status: string): string => {
  const statusMessages: Record<string, string> = {
    'pending': 'En attente d\'assignation',
    'confirmed': 'Confirmée',
    'driver_assigned': 'Chauffeur assigné',
    'in_progress': 'En cours',
    'picked_up': 'Collectée',
    'in_transit': 'En livraison',
    'delivered': 'Livrée',
    'completed': 'Terminée',
    'cancelled': 'Annulée',
    'no_driver_available': 'Aucun chauffeur disponible'
  };

  return statusMessages[status] || status;
};