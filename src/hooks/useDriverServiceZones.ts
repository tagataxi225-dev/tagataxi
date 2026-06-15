/**
 * 🗺️ Hook gestion zones de service chauffeur
 * - Chargement des zones disponibles
 * - Activation/désactivation des zones
 * - Sauvegarde dans chauffeurs.service_areas
 * - Statistiques par zone
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDriverCity } from './useDriverCity';

export interface ServiceZone {
  id: string;
  name: string;
  city: string;
  active: boolean;
  polygon?: any;
  rides_count?: number;
  earnings?: number;
  demand_level?: 'low' | 'medium' | 'high';
}

export const useDriverServiceZones = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { city: driverCity, loading: loadingCity } = useDriverCity();

  // ✅ PHASE 3 : Charger uniquement les zones de la ville du chauffeur
  const { data: availableZones, isLoading: loadingZones } = useQuery({
    queryKey: ['service-zones', driverCity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_zones')
        .select('*')
        .eq('city', driverCity) // 🔥 FILTRAGE PAR VILLE ICI
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!driverCity
  });

  // Charger les zones actives du chauffeur
  const { data: driverZones, isLoading: loadingDriver } = useQuery({
    queryKey: ['driver-service-zones', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('chauffeurs')
        .select('service_areas')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Charger les stats par zone avec demande temps réel
  const { data: zoneStats } = useQuery({
    queryKey: ['zone-stats', user?.id, driverCity],
    queryFn: async () => {
      if (!user) return {};

      // Stats courses par zone (historique chauffeur)
      const { data: driverData, error } = await supabase
        .from('transport_bookings')
        .select('pickup_zone, fare')
        .eq('driver_id', user.id)
        .eq('status', 'completed');

      if (error) throw error;

      // Agréger par zone
      const stats = (driverData || []).reduce((acc: any, booking: any) => {
        const zone = booking.pickup_zone || 'unknown';
        if (!acc[zone]) {
          acc[zone] = { rides: 0, earnings: 0, recentDemand: 0 };
        }
        acc[zone].rides += 1;
        acc[zone].earnings += booking.fare || 0;
        return acc;
      }, {});

      // ✅ Demande temps réel: compter les courses des 30 dernières minutes par zone
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recentBookings } = await supabase
        .from('transport_bookings')
        .select('pickup_zone')
        .eq('city', driverCity)
        .in('status', ['pending', 'searching_driver', 'driver_assigned'])
        .gte('created_at', thirtyMinutesAgo);

      // Ajouter la demande récente par zone
      (recentBookings || []).forEach((booking: any) => {
        const zone = booking.pickup_zone || 'unknown';
        if (!stats[zone]) {
          stats[zone] = { rides: 0, earnings: 0, recentDemand: 0 };
        }
        stats[zone].recentDemand = (stats[zone].recentDemand || 0) + 1;
      });

      return stats;
    },
    enabled: !!user && !!driverCity,
    refetchInterval: 60000 // Rafraîchir toutes les minutes
  });

  // Combiner les données pour afficher les zones avec leur statut
  const zones: ServiceZone[] = (availableZones || []).map((zone: any) => {
    const activeZonesArray = Array.isArray(driverZones?.service_areas) 
      ? driverZones.service_areas 
      : [];
    const zoneStat = zoneStats?.[zone.name] || { rides: 0, earnings: 0, recentDemand: 0 };

    // ✅ Calculer la demande basée sur activité récente
    const recentDemand = zoneStat.recentDemand || 0;
    let demandLevel: 'low' | 'medium' | 'high' = 'low';
    if (recentDemand >= 5) demandLevel = 'high';
    else if (recentDemand >= 2) demandLevel = 'medium';

    return {
      id: zone.id,
      name: zone.name,
      city: zone.city,
      active: activeZonesArray.includes(zone.id),
      polygon: zone.polygon,
      rides_count: zoneStat.rides,
      earnings: zoneStat.earnings,
      demand_level: demandLevel,
      recent_demand: recentDemand
    };
  });

  // Toggle une zone
  const toggleZone = useMutation({
    mutationFn: async (zoneId: string) => {
      if (!user) throw new Error('Non authentifié');

      const currentZones = Array.isArray(driverZones?.service_areas) 
        ? driverZones.service_areas 
        : [];
      
      const isActive = currentZones.includes(zoneId);
      const newZones = isActive
        ? currentZones.filter((id: string) => id !== zoneId)
        : [...currentZones, zoneId];

      const { error } = await supabase
        .from('chauffeurs')
        .update({ service_areas: newZones })
        .eq('user_id', user.id);

      if (error) throw error;

      return { zoneId, isActive: !isActive };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driver-service-zones'] });
      toast.success(
        data.isActive 
          ? 'Zone activée avec succès' 
          : 'Zone désactivée'
      );
    },
    onError: (error) => {
      console.error('Error toggling zone:', error);
      toast.error('Erreur lors de la mise à jour des zones');
    }
  });

  // Activer plusieurs zones à la fois
  const setActiveZones = useMutation({
    mutationFn: async (zoneIds: string[]) => {
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('chauffeurs')
        .update({ service_areas: zoneIds })
        .eq('user_id', user.id);

      if (error) throw error;
      return zoneIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-service-zones'] });
      toast.success('Zones mises à jour');
    }
  });

  const activeZones = zones.filter(z => z.active);
  const suggestedZones = zones
    .filter(z => !z.active && z.demand_level === 'high')
    .slice(0, 3);

  return {
    zones,
    activeZones,
    suggestedZones,
    driverCity, // ✅ Maintenant disponible depuis useDriverCity
    loading: loadingZones || loadingDriver || loadingCity,
    toggleZone,
    setActiveZones,
    zoneStats
  };
};
