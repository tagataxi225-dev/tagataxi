import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  onlineDrivers: number;
  activeRides: number;
  totalRevenue: number;
  pendingProducts: number;
  pendingVerifications: number;
  completedToday: number;
  totalBookings: number;
  // Extended stats for EnhancedDashboard
  weeklyRevenue?: number;
  todayRevenue?: number;
  monthlyRevenue?: number;
  completedRides?: number;
  cancelledRides?: number;
  averageRating?: number;
  activeProducts?: number;
  supportTickets?: number;
  pendingTickets?: number;
  topZones?: any[];
  recentActivities?: any[];
  responseTime?: number;
  successRate?: number;
  totalOrders?: number;
  completedOrders?: number;
  totalProducts?: number;
}

const fetchAdminStats = async (): Promise<AdminStats> => {
  console.log('🔄 [useAdminStats] Fetching admin stats...');
  const startTime = Date.now();

  // ✅ OPTIMISATION : 4 requêtes parallèles au lieu de 17
  const [clientsRes, driversRes, bookingsRes, productsRes] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('chauffeurs').select('id, is_active, updated_at'),
    supabase.from('transport_bookings').select('id, status, actual_price, created_at'),
    supabase.from('marketplace_products').select('id, moderation_status', { count: 'exact' })
  ]);

  const drivers = driversRes.data || [];
  const bookings = bookingsRes.data || [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Calculate online drivers (active in last 15 minutes)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const onlineDrivers = drivers.filter(d => 
    d.is_active && new Date(d.updated_at) >= fifteenMinutesAgo
  ).length;

  const stats: AdminStats = {
    totalUsers: clientsRes.count || 0,
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(d => d.is_active).length,
    onlineDrivers,
    activeRides: bookings.filter(b => 
      ['pending', 'accepted', 'in_progress'].includes(b.status)
    ).length,
    totalRevenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.actual_price || 0), 0),
    pendingProducts: productsRes.data?.filter(p => 
      p.moderation_status === 'pending'
    ).length || 0,
    pendingVerifications: 0, // Will be fetched if needed
    completedToday: bookings.filter(b => 
      b.status === 'completed' && new Date(b.created_at) >= todayStart
    ).length,
    totalBookings: bookings.length
  };

  console.log(`✅ [useAdminStats] Stats loaded in ${Date.now() - startTime}ms`, stats);
  return stats;
};

export const useAdminStats = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    staleTime: 5 * 60 * 1000, // ✅ Cache 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false, // Évite refetch au changement d'onglet
    retry: 2,
    retryDelay: 1000
  });

  // ✅ Realtime: 1 seul channel avec invalidation cache
  useEffect(() => {
    const channel = supabase
      .channel('admin-global-stats')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transport_bookings' },
        () => {
          console.log('🔄 [Realtime] Transport bookings changed, invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'marketplace_products' },
        () => {
          console.log('🔄 [Realtime] New product added, invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chauffeurs' },
        () => {
          console.log('🔄 [Realtime] Driver status changed, invalidating cache');
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ✅ Alerte si chargement > 5 secondes
  useEffect(() => {
    if (query.isLoading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Stats loading timeout (>5s) - Check RLS policies');
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [query.isLoading]);

  return {
    stats: query.data,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};
