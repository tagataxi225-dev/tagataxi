/**
 * Hook pour récupérer et surveiller les courses taxi actives du client
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ActiveTransportBooking {
  id: string;
  status: string;
  vehicle_type: string;
  pickup_location: string;
  destination: string;
  estimated_price: number | null;
  created_at: string;
  driver_id: string | null;
}

const ACTIVE_STATUSES = ['pending', 'searching', 'confirmed', 'accepted', 'driver_assigned', 'driver_en_route', 'picked_up', 'in_progress'];
const EXCLUDED_STATUSES = ['cancelled', 'completed', 'rejected', 'expired'];
const PENDING_STATUSES = ['pending', 'searching', 'confirmed'];
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

const isActiveBooking = (b: { status: string; created_at: string }): boolean => {
  if (EXCLUDED_STATUSES.includes(b.status)) return false;
  if (PENDING_STATUSES.includes(b.status)) {
    return Date.now() - new Date(b.created_at).getTime() < FIFTEEN_MIN_MS;
  }
  return true;
};

export const useClientActiveTransportBookings = () => {
  const { user } = useAuth();
  const [activeBookings, setActiveBookings] = useState<ActiveTransportBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveBookings = useCallback(async () => {
    if (!user?.id) {
      setActiveBookings([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transport_bookings')
        .select('id, status, vehicle_type, pickup_location, destination, estimated_price, created_at, driver_id')
        .eq('user_id', user.id)
        .in('status', ACTIVE_STATUSES)
        .not('status', 'in', '("cancelled","completed","rejected","expired")')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [ActiveTransportBookings] Erreur fetch:', error);
        return;
      }

      setActiveBookings((data || []).filter(isActiveBooking));
    } catch (error) {
      console.error('❌ [ActiveTransportBookings] Exception:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchActiveBookings();
    // Réévalue les pending expirés toutes les minutes sans attendre un événement Supabase
    const interval = setInterval(fetchActiveBookings, 60_000);
    return () => clearInterval(interval);
  }, [fetchActiveBookings]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`transport_bookings_client_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transport_bookings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newStatus = (payload.new as any)?.status;
          if (newStatus && EXCLUDED_STATUSES.includes(newStatus)) {
            setActiveBookings(prev => prev.filter(b => b.id !== (payload.new as any).id));
            return;
          }
          fetchActiveBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchActiveBookings]);

  const hasActiveBookings = activeBookings.length > 0;
  const mostRecentBooking = activeBookings[0] || null;

  return {
    activeBookings,
    hasActiveBookings,
    mostRecentBooking,
    loading,
    refetch: fetchActiveBookings
  };
};
