import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { Database } from '@/integrations/supabase/types';

export type Zone = Database['public']['Tables']['service_zones']['Row'] & {
  center?: { lat: number; lng: number };
};

export interface ZoneStatistics {
  zone_id: string;
  total_rides: number;
  total_deliveries: number;
  total_revenue: number;
  average_wait_time: number;
  average_trip_duration: number;
  active_drivers: number;
  available_drivers: number;
  customer_satisfaction_avg: number;
  cancellation_rate: number;
  completion_rate: number;
  calculated_at: string;
}

export type ZonePricingRule = Database['public']['Tables']['zone_pricing_rules']['Row'];

export const useZoneManagement = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneStatistics, setZoneStatistics] = useState<Record<string, ZoneStatistics>>({});
  const [zonePricingRules, setZonePricingRules] = useState<Record<string, ZonePricingRule[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger toutes les zones
  const loadZones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_zones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setZones((data || []) as Zone[]);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les zones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques d'une zone
  const loadZoneStatistics = async (zoneId: string) => {
    try {
      const { data, error } = await supabase
        .from('zone_statistics')
        .select('*')
        .eq('zone_id', zoneId)
        .is('hour_of_day', null) // Statistiques journalières
        .order('date', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setZoneStatistics(prev => ({
          ...prev,
          [zoneId]: data[0]
        }));
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  // Charger les règles de tarification d'une zone
  const loadZonePricingRules = async (zoneId: string) => {
    try {
      const { data, error } = await supabase
        .from('zone_pricing_rules')
        .select('*')
        .eq('zone_id', zoneId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setZonePricingRules(prev => ({
        ...prev,
        [zoneId]: (data || []) as ZonePricingRule[]
      }));
    } catch (err: any) {
      console.error('Erreur lors du chargement des règles de tarification:', err);
    }
  };

  // Créer une nouvelle zone
  const createZone = async (zoneData: Partial<Zone>) => {
    try {
      const { data, error } = await supabase
        .from('service_zones')
        .insert({
          name: zoneData.name || '',
          coordinates: zoneData.coordinates || [],
          zone_type: zoneData.zone_type || 'custom',
          city: zoneData.city || '',
          is_active: zoneData.is_active || true,
          status: zoneData.status || 'active',
          surge_multiplier: zoneData.surge_multiplier || 1.0,
          base_price_multiplier: zoneData.base_price_multiplier || 1.0,
          description: zoneData.description,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setZones(prev => [data as Zone, ...prev]);
      toast({
        title: "Succès",
        description: "Zone créée avec succès",
      });

      return data;
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Mettre à jour une zone
  const updateZone = async (zoneId: string, updates: Partial<Zone>) => {
    try {
      const { data, error } = await supabase
        .from('service_zones')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', zoneId)
        .select()
        .single();

      if (error) throw error;

      setZones(prev => prev.map(zone => 
        zone.id === zoneId ? { ...zone, ...data as Zone } : zone
      ));

      toast({
        title: "Succès",
        description: "Zone mise à jour avec succès",
      });

      return data;
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Supprimer une zone
  const deleteZone = async (zoneId: string) => {
    try {
      const { error } = await supabase
        .from('service_zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      setZones(prev => prev.filter(zone => zone.id !== zoneId));
      toast({
        title: "Succès",
        description: "Zone supprimée avec succès",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Activer/Désactiver une zone
  const toggleZoneStatus = async (zoneId: string, status: 'active' | 'inactive' | 'maintenance') => {
    try {
      await updateZone(zoneId, { status });
    } catch (err: any) {
      console.error('Erreur lors du changement de statut:', err);
    }
  };

  // Créer/Mettre à jour les règles de tarification
  const upsertPricingRule = async (rule: Partial<ZonePricingRule>) => {
    try {
      const { data, error } = await supabase
        .from('zone_pricing_rules')
        .upsert({
          zone_id: rule.zone_id || '',
          vehicle_class: rule.vehicle_class || 'standard',
          base_price: rule.base_price || 0,
          price_per_km: rule.price_per_km || 0,
          price_per_minute: rule.price_per_minute || 0,
          surge_multiplier: rule.surge_multiplier || 1.0,
          minimum_fare: rule.minimum_fare || 0,
          maximum_fare: rule.maximum_fare,
          time_based_pricing: rule.time_based_pricing,
          special_pricing: rule.special_pricing,
          is_active: rule.is_active || true,
          valid_from: rule.valid_from || new Date().toISOString(),
          valid_until: rule.valid_until,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Recharger les règles pour cette zone
      if (rule.zone_id) {
        await loadZonePricingRules(rule.zone_id);
      }

      toast({
        title: "Succès",
        description: "Règle de tarification mise à jour",
      });

      return data;
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Calculer les statistiques pour une zone
  const calculateZoneStatistics = async (zoneId: string, date?: string) => {
    try {
      const { error } = await supabase.rpc('calculate_zone_statistics', {
        zone_id_param: zoneId,
        date_param: date || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      // Recharger les statistiques
      await loadZoneStatistics(zoneId);

      toast({
        title: "Succès",
        description: "Statistiques calculées avec succès",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Obtenir la tarification d'une zone
  const getZonePricing = async (zoneId: string, vehicleClass: string = 'standard') => {
    try {
      const { data, error } = await supabase.rpc('get_zone_pricing', {
        zone_id_param: zoneId,
        vehicle_class_param: vehicleClass
      });

      if (error) throw error;
      return data[0] || null;
    } catch (err: any) {
      console.error('Erreur lors de la récupération des prix:', err);
      return null;
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  return {
    zones,
    zoneStatistics,
    zonePricingRules,
    loading,
    error,
    loadZones,
    loadZoneStatistics,
    loadZonePricingRules,
    createZone,
    updateZone,
    deleteZone,
    toggleZoneStatus,
    upsertPricingRule,
    calculateZoneStatistics,
    getZonePricing,
  };
};