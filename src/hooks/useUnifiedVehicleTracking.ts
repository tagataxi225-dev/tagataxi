/**
 * 🚗 Hook de tracking multi-véhicules unifié
 * Suivi temps réel des taxis et livreurs via Supabase Realtime
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { VehicleType } from '@/components/maps/VehicleMarkerIcons';

export interface TrackedVehicle {
  id: string;
  driver_id: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  vehicle_class: VehicleType;
  status: 'available' | 'busy' | 'offline';
  driver_name?: string;
  driver_photo?: string;
  vehicle_model?: string;
  is_delivering?: boolean;
  delivery_status?: 'pickup' | 'in_transit' | 'delivered';
  updated_at: string;
}

export type VehicleFilter = 'all' | 'taxi' | 'delivery';

interface UseUnifiedVehicleTrackingOptions {
  filter?: VehicleFilter;
  userLocation?: { lat: number; lng: number } | null;
  radiusKm?: number;
  enabled?: boolean;
  updateInterval?: number; // ms
}

interface VehicleTrackingState {
  vehicles: TrackedVehicle[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  vehicleCount: {
    total: number;
    taxi: number;
    delivery: number;
    available: number;
  };
}

/**
 * Mappe vehicle_class de la DB vers nos types
 */
const normalizeVehicleClass = (dbClass: string | null): VehicleType => {
  const mapping: Record<string, VehicleType> = {
    'taxi': 'taxi',
    'taxi_eco': 'taxi',
    'taxi_confort': 'taxi',
    'taxi_premium': 'taxi',
    'taxi_moto': 'moto_flash',
    'moto': 'moto_flash',
    'moto_flash': 'moto_flash',
    'flash': 'moto_flash',
    'van': 'van_flex',
    'van_flex': 'van_flex',
    'flex': 'van_flex',
    'truck': 'truck_maxicharge',
    'truck_maxicharge': 'truck_maxicharge',
    'maxicharge': 'truck_maxicharge',
    'camion': 'truck_maxicharge'
  };
  
  return mapping[dbClass?.toLowerCase() || ''] || 'taxi';
};

/**
 * Calcule la distance entre deux points en km
 */
const haversineDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useUnifiedVehicleTracking = ({
  filter = 'all',
  userLocation,
  radiusKm = 10,
  enabled = true,
  updateInterval = 3000
}: UseUnifiedVehicleTrackingOptions = {}): VehicleTrackingState & {
  refreshVehicles: () => Promise<void>;
  setFilter: (filter: VehicleFilter) => void;
} => {
  const [state, setState] = useState<VehicleTrackingState>({
    vehicles: [],
    loading: true,
    error: null,
    lastUpdate: null,
    vehicleCount: { total: 0, taxi: 0, delivery: 0, available: 0 }
  });
  
  const [currentFilter, setCurrentFilter] = useState<VehicleFilter>(filter);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const vehicleMapRef = useRef<Map<string, TrackedVehicle>>(new Map());

  /**
   * Transforme les données DB en TrackedVehicle
   */
  const transformDriverLocation = useCallback((row: any): TrackedVehicle | null => {
    if (!row.lat || !row.lng) return null;
    
    const vehicleClass = normalizeVehicleClass(row.vehicle_class);
    
    // Filtrer par rayon si userLocation fourni
    if (userLocation) {
      const distance = haversineDistance(
        userLocation.lat, userLocation.lng,
        row.lat, row.lng
      );
      if (distance > radiusKm) return null;
    }
    
    return {
      id: row.id,
      driver_id: row.driver_id,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      heading: row.heading || 0,
      speed: row.speed || 0,
      vehicle_class: vehicleClass,
      status: row.is_online && row.is_available ? 'available' : 
              row.is_online ? 'busy' : 'offline',
      driver_name: row.chauffeurs?.display_name,
      driver_photo: row.chauffeurs?.profile_photo_url,
      vehicle_model: row.chauffeurs?.vehicle_model,
      is_delivering: row.is_delivering || false,
      delivery_status: row.delivery_status,
      updated_at: row.updated_at
    };
  }, [userLocation, radiusKm]);

  /**
   * Filtre les véhicules selon le type
   */
  const filterVehicles = useCallback((vehicles: TrackedVehicle[]): TrackedVehicle[] => {
    if (currentFilter === 'all') return vehicles;
    
    if (currentFilter === 'taxi') {
      return vehicles.filter(v => v.vehicle_class === 'taxi');
    }
    
    // delivery = moto, van, truck
    return vehicles.filter(v => 
      ['moto_flash', 'van_flex', 'truck_maxicharge'].includes(v.vehicle_class)
    );
  }, [currentFilter]);

  /**
   * Charge les véhicules depuis la DB
   */
  const fetchVehicles = useCallback(async () => {
    if (!enabled) return;
    
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select(`
          id,
          driver_id,
          lat,
          lng,
          heading,
          speed,
          vehicle_class,
          is_online,
          is_available,
          is_delivering,
          delivery_status,
          updated_at,
          chauffeurs!driver_id (
            display_name,
            profile_photo_url,
            vehicle_model
          )
        `)
        .eq('is_online', true)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const transformedVehicles = (data || [])
        .map(transformDriverLocation)
        .filter((v): v is TrackedVehicle => v !== null);

      // Mettre à jour le cache
      vehicleMapRef.current.clear();
      transformedVehicles.forEach(v => vehicleMapRef.current.set(v.id, v));

      const filtered = filterVehicles(transformedVehicles);
      
      setState(prev => ({
        ...prev,
        vehicles: filtered,
        loading: false,
        error: null,
        lastUpdate: new Date(),
        vehicleCount: {
          total: transformedVehicles.length,
          taxi: transformedVehicles.filter(v => v.vehicle_class === 'taxi').length,
          delivery: transformedVehicles.filter(v => 
            ['moto_flash', 'van_flex', 'truck_maxicharge'].includes(v.vehicle_class)
          ).length,
          available: transformedVehicles.filter(v => v.status === 'available').length
        }
      }));
    } catch (err: any) {
      console.error('❌ Erreur fetch véhicules:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Erreur de chargement'
      }));
    }
  }, [enabled, transformDriverLocation, filterVehicles]);

  /**
   * Gère les updates Realtime
   */
  const handleRealtimeUpdate = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'DELETE') {
      vehicleMapRef.current.delete(oldRecord.id);
    } else {
      const vehicle = transformDriverLocation(newRecord);
      if (vehicle) {
        vehicleMapRef.current.set(vehicle.id, vehicle);
      } else {
        vehicleMapRef.current.delete(newRecord.id);
      }
    }

    // Mettre à jour l'état avec les véhicules filtrés
    const allVehicles = Array.from(vehicleMapRef.current.values());
    const filtered = filterVehicles(allVehicles);
    
    setState(prev => ({
      ...prev,
      vehicles: filtered,
      lastUpdate: new Date(),
      vehicleCount: {
        total: allVehicles.length,
        taxi: allVehicles.filter(v => v.vehicle_class === 'taxi').length,
        delivery: allVehicles.filter(v => 
          ['moto_flash', 'van_flex', 'truck_maxicharge'].includes(v.vehicle_class)
        ).length,
        available: allVehicles.filter(v => v.status === 'available').length
      }
    }));
  }, [transformDriverLocation, filterVehicles]);

  /**
   * Setup subscription Realtime
   */
  useEffect(() => {
    if (!enabled) return;

    // Fetch initial
    fetchVehicles();

    // Subscribe aux changements
    const channel = supabase
      .channel('live-vehicle-tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations'
        },
        handleRealtimeUpdate
      )
      .subscribe((status) => {
        console.log('🚗 Vehicle tracking subscription:', status);
      });

    channelRef.current = channel;

    // Polling de secours toutes les N secondes
    const pollingInterval = setInterval(fetchVehicles, updateInterval);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      clearInterval(pollingInterval);
    };
  }, [enabled, fetchVehicles, handleRealtimeUpdate, updateInterval]);

  /**
   * Re-filtrer quand le filtre change
   */
  useEffect(() => {
    const allVehicles = Array.from(vehicleMapRef.current.values());
    const filtered = filterVehicles(allVehicles);
    setState(prev => ({ ...prev, vehicles: filtered }));
  }, [currentFilter, filterVehicles]);

  return {
    ...state,
    refreshVehicles: fetchVehicles,
    setFilter: setCurrentFilter
  };
};

export default useUnifiedVehicleTracking;
