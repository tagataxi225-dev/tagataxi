import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface RealTimeStats {
  totalUsers: number
  totalDrivers: number
  onlineDrivers: number
  activeRides: number
  totalRevenue: number
  recentActivities: ActivityLog[]
  onlineDriversList: OnlineDriver[]
}

interface ActivityLog {
  id: string
  activity_type: string
  description: string
  created_at: string
  amount?: number
}

interface OnlineDriver {
  user_id: string
  rating_average?: number
  total_rides: number
  service_type?: string
  last_ping: string
}

export const useRealTimeStats = () => {
  const [stats, setStats] = useState<RealTimeStats>({
    totalUsers: 0,
    totalDrivers: 0,
    onlineDrivers: 0,
    activeRides: 0,
    totalRevenue: 0,
    recentActivities: [],
    onlineDriversList: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch total drivers count
      const { count: driversCount } = await supabase
        .from('driver_profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch online drivers with proper join
      const { data: onlineDriversData, count: onlineCount } = await supabase
        .from('driver_profiles')
        .select(`
          user_id,
          rating_average,
          total_rides,
          service_type
        `)
        .eq('is_active', true)
        .gte('updated_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Active in last 15 minutes

      // Fetch active rides/deliveries
      const { count: activeRidesCount } = await supabase
        .from('transport_bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'accepted', 'in_progress'])

      const { count: activeDeliveriesCount } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'accepted', 'in_progress'])

      // Fetch total revenue from transport bookings and delivery orders
      const { data: transportRevenueData } = await supabase
        .from('transport_bookings')
        .select('actual_price')
        .eq('status', 'completed')

      const { data: deliveryRevenueData } = await supabase
        .from('delivery_orders')
        .select('actual_price')
        .eq('status', 'completed')

      const transportRevenue = transportRevenueData?.reduce((sum, booking) => sum + (booking.actual_price || 0), 0) || 0
      const deliveryRevenue = deliveryRevenueData?.reduce((sum, order) => sum + (order.actual_price || 0), 0) || 0
      const totalRevenue = transportRevenue + deliveryRevenue

      // Fetch recent activities
      const { data: activitiesData } = await supabase
        .from('activity_logs')
        .select(`
          id,
          activity_type,
          description,
          created_at,
          amount,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      // Transform online drivers data
      const onlineDriversList: OnlineDriver[] = onlineDriversData?.map(driver => ({
        user_id: driver.user_id,
        rating_average: driver.rating_average,
        total_rides: driver.total_rides || 0,
        service_type: driver.service_type,
        last_ping: new Date().toISOString() // Since we filtered by recent activity
      })) || []

      // Transform activities data
      const recentActivities: ActivityLog[] = activitiesData?.map(activity => ({
        id: activity.id,
        activity_type: activity.activity_type,
        description: activity.description,
        created_at: activity.created_at,
        amount: activity.amount
      })) || []

      setStats({
        totalUsers: usersCount || 0,
        totalDrivers: driversCount || 0,
        onlineDrivers: onlineCount || 0,
        activeRides: (activeRidesCount || 0) + (activeDeliveriesCount || 0),
        totalRevenue,
        recentActivities,
        onlineDriversList
      })

    } catch (err) {
      console.error('Error fetching real-time stats:', err)
      setError('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Set up real-time subscription for activities
    const channel = supabase
      .channel('realtime-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs'
        },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_profiles'
        },
        () => fetchStats()
      )
      .subscribe()

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  }
}