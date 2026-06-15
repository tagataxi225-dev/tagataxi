/**
 * 🟢 Hook de Gestion du Statut Chauffeur
 * Gère l'état en ligne/hors ligne + disponibilité
 * SYNCHRONISÉ avec driver_profiles dans la DB
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DriverStatus {
  isOnline: boolean;
  isAvailable: boolean;
  currentOrderId: string | null;
  currentOrderType: 'taxi' | 'delivery' | 'marketplace' | null;
  serviceTypes: string[];
}

export const useDriverStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goOnlineError, setGoOnlineError] = useState<string | null>(null);
  const [status, setStatus] = useState<DriverStatus>({
    isOnline: false,
    isAvailable: false,
    currentOrderId: null,
    currentOrderType: null,
    serviceTypes: ['taxi', 'delivery', 'marketplace']
  });

  // ✅ PHASE 1: Charger le statut depuis driver_locations (source de vérité unifiée)
  const loadDriverStatus = useCallback(async () => {
    if (!user) return;

    try {
      // Charger depuis driver_locations ET chauffeurs
      const { data: driverLocation, error: locationError } = await supabase
        .from('driver_locations')
        .select('is_online, is_available')
        .eq('driver_id', user.id)
        .single();

      const { data: chauffeur, error: chauffeurError } = await supabase
        .from('chauffeurs')
        .select('verification_status')
        .eq('user_id', user.id)
        .single();

      if (locationError && locationError.code !== 'PGRST116') {
        console.error('Error loading driver location:', locationError);
      }

      // Utiliser driver_locations.is_online comme source de vérité
      const isOnline = driverLocation?.is_online || false;
      const isVerified = chauffeur?.verification_status === 'verified';

      setStatus({
        isOnline,
        isAvailable: isOnline && isVerified && (driverLocation?.is_available || false),
        currentOrderId: null,
        currentOrderType: null,
        serviceTypes: ['taxi', 'delivery', 'marketplace']
      });
    } catch (error: any) {
      console.error('Error loading driver status:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ PHASE 1: Passer en ligne (mise à jour driver_locations + trigger auto sync chauffeurs)
  const goOnline = async (latitude?: number, longitude?: number): Promise<boolean> => {
    console.warn('[goOnline] appelé | lat:', latitude, 'lng:', longitude, 'user:', user?.id ?? 'null');
    if (!user) { setGoOnlineError('user null'); return false; }

    const lat = latitude ?? 0;
    const lng = longitude ?? 0;
    if (lat === 0 && lng === 0) {
      console.warn('[goOnline] BLOQUÉ : lat/lng = 0,0');
      setGoOnlineError('lat/lng = 0,0 — GPS non reçu');
      return false;
    }

    setLoading(true);
    setGoOnlineError(null);
    try {
      // 1. Mettre à jour driver_locations (source de vérité)
      console.warn('[goOnline] → upsert driver_locations | lat:', lat, 'lng:', lng);
      const { error: locationError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          is_online: true,
          is_available: true,
          last_ping: new Date().toISOString(),
          latitude: lat,
          longitude: lng
        }, { onConflict: 'driver_id' });

      console.warn('[goOnline] upsert résultat | error:', locationError ?? 'OK');
      if (locationError) {
        console.error('[goOnline] ❌ upsert échoué:', locationError.message, locationError.code, locationError.details);
        setGoOnlineError('upsert: ' + locationError.message);
        return false;
      }

      // 2. Synchroniser chauffeurs.is_active (le trigger le fera aussi)
      console.warn('[goOnline] → update chauffeurs.is_active');
      const { error: chauffeurError } = await supabase
        .from('chauffeurs')
        .update({ is_active: true })
        .eq('user_id', user.id);

      console.warn('[goOnline] chauffeurs résultat | error:', chauffeurError ?? 'OK');
      if (chauffeurError) {
        console.warn('[goOnline] ⚠️ chauffeurs update échoué (non bloquant):', chauffeurError.message);
      }

      setStatus(prev => ({ ...prev, isOnline: true, isAvailable: true }));
      console.warn('[goOnline] ✅ succès');
      return true;
    } catch (error: any) {
      console.error('[goOnline] ❌ exception:', error);
      setGoOnlineError('exception: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ PHASE 1: Passer hors ligne (mise à jour driver_locations + sync chauffeurs)
  const goOffline = async (): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      // 1. Mettre à jour driver_locations
      const { error: locationError } = await supabase
        .from('driver_locations')
        .update({ 
          is_online: false, 
          is_available: false,
          last_ping: new Date().toISOString()
        })
        .eq('driver_id', user.id);

      if (locationError) {
        console.error('Error updating driver location:', locationError);
        return false;
      }

      // is_active reste true en permanence (compte actif sur la plateforme)
      // L'état en ligne est géré par driver_locations.is_online uniquement

      setStatus(prev => ({ ...prev, isOnline: false, isAvailable: false }));
      return true;
    } catch (error: any) {
      console.error('Error going offline:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Marquer comme disponible
  const setAvailable = async (isAvailable: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({ is_available: isAvailable })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating availability:', error);
        return false;
      }

      setStatus(prev => ({ ...prev, isAvailable }));
      return true;
    } catch (error: any) {
      console.error('Error updating availability:', error);
      return false;
    }
  };

  // ✅ Marquer comme occupé (avec commande en cours)
  const markBusy = async (orderId: string, orderType: 'taxi' | 'delivery' | 'marketplace'): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({
          is_available: false,
          current_order_id: orderId,
          current_order_type: orderType
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking busy:', error);
        return false;
      }

      setStatus(prev => ({
        ...prev,
        isAvailable: false,
        currentOrderId: orderId,
        currentOrderType: orderType
      }));

      return true;
    } catch (error: any) {
      console.error('Error marking busy:', error);
      return false;
    }
  };

  // ✅ Marquer comme disponible (terminer la commande)
  const markAvailable = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({
          is_available: true,
          current_order_id: null,
          current_order_type: null
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking available:', error);
        return false;
      }

      setStatus(prev => ({
        ...prev,
        isAvailable: true,
        currentOrderId: null,
        currentOrderType: null
      }));

      return true;
    } catch (error: any) {
      console.error('Error marking available:', error);
      return false;
    }
  };

  // ✅ Mettre à jour les types de service acceptés
  const updateServiceTypes = async (serviceTypes: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('driver_service_preferences')
        .update({ service_types: serviceTypes })
        .eq('driver_id', user.id);

      if (error) {
        console.error('Error updating service types:', error);
        return false;
      }

      setStatus(prev => ({ ...prev, serviceTypes }));
      toast.success('Préférences de service mises à jour');
      return true;
    } catch (error: any) {
      console.error('Error updating service types:', error);
      return false;
    }
  };

  // Charger le statut au montage
  useEffect(() => {
    if (user) {
      loadDriverStatus();
    }
  }, [user, loadDriverStatus]);

  return {
    status,
    loading,
    goOnlineError,
    goOnline,
    goOffline,
    setAvailable,
    markBusy,
    markAvailable,
    updateServiceTypes
  };
};
