import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Car, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MetricsData {
  activeDrivers: number;
  totalDrivers: number;
  onlineRate: number;
  activeRides: number;
  pendingDeliveries: number;
  hourlyRevenue: number;
  previousHourRevenue: number;
  avgWaitTime: number;
  completionRate: number;
}

export const RealTimeMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      // Get driver statistics
      const { data: driverStats } = await supabase
        .from('driver_online_status_table')
        .select('*');

      const totalOnline = driverStats?.reduce((sum, stat) => sum + (stat.online_drivers || 0), 0) || 0;
      const totalDrivers = driverStats?.reduce((sum, stat) => sum + (stat.total_drivers || 0), 0) || 0;

      // Get active rides
      const { data: activeRides } = await supabase
        .from('transport_bookings')
        .select('id')
        .in('status', ['pending', 'confirmed', 'driver_assigned', 'in_progress']);

      // Get pending deliveries
      const { data: pendingDeliveries } = await supabase
        .from('delivery_orders')
        .select('id')
        .in('status', ['pending', 'confirmed', 'driver_assigned', 'picked_up', 'in_transit']);

      // Calculate hourly revenue
      const currentHour = new Date();
      currentHour.setMinutes(0, 0, 0);
      const previousHour = new Date(currentHour.getTime() - 60 * 60 * 1000);

      const { data: currentHourBookings } = await supabase
        .from('transport_bookings')
        .select('actual_price, estimated_price')
        .gte('created_at', currentHour.toISOString())
        .eq('status', 'completed');

      const { data: previousHourBookings } = await supabase
        .from('transport_bookings')
        .select('actual_price, estimated_price')
        .gte('created_at', previousHour.toISOString())
        .lt('created_at', currentHour.toISOString())
        .eq('status', 'completed');

      const currentRevenue = currentHourBookings?.reduce((sum, booking) => 
        sum + (booking.actual_price || booking.estimated_price || 0), 0) || 0;

      const previousRevenue = previousHourBookings?.reduce((sum, booking) => 
        sum + (booking.actual_price || booking.estimated_price || 0), 0) || 0;

      // Calculate completion rate
      const { data: todayBookings } = await supabase
        .from('transport_bookings')
        .select('status')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const completed = todayBookings?.filter(b => b.status === 'completed').length || 0;
      const total = todayBookings?.length || 0;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      setMetrics({
        activeDrivers: totalOnline,
        totalDrivers,
        onlineRate: totalDrivers > 0 ? (totalOnline / totalDrivers) * 100 : 0,
        activeRides: activeRides?.length || 0,
        pendingDeliveries: pendingDeliveries?.length || 0,
        hourlyRevenue: currentRevenue,
        previousHourRevenue: previousRevenue,
        avgWaitTime: 4.5, // Simulate average wait time
        completionRate
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    
    // Set up real-time subscriptions
    const driversChannel = supabase
      .channel('drivers_metrics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations' },
        () => fetchMetrics()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transport_bookings' },
        () => fetchMetrics()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(driversChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Impossible de charger les métriques</p>
        </CardContent>
      </Card>
    );
  }

  const revenueChange = metrics.previousHourRevenue > 0 
    ? ((metrics.hourlyRevenue - metrics.previousHourRevenue) / metrics.previousHourRevenue) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Métriques Temps Réel</h2>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Mis à jour il y a {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s
        </Badge>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Drivers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-600" />
              Chauffeurs Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.activeDrivers}
            </div>
            <div className="text-sm text-muted-foreground">
              sur {metrics.totalDrivers} total
            </div>
            <Progress 
              value={metrics.onlineRate} 
              className="mt-2 h-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.onlineRate.toFixed(1)}% en ligne
            </div>
          </CardContent>
        </Card>

        {/* Active Rides */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              Courses Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.activeRides}
            </div>
            <div className="text-sm text-muted-foreground">
              en cours
            </div>
          </CardContent>
        </Card>

        {/* Hourly Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-600" />
              Revenus/Heure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {metrics.hourlyRevenue.toLocaleString()} CDF
            </div>
            <div className="flex items-center gap-1 text-sm">
              {revenueChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(revenueChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs heure précédente</span>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Taux de Réussite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.completionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              courses terminées
            </div>
            <Progress 
              value={metrics.completionRate} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Livraisons en Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {metrics.pendingDeliveries}
            </div>
            <p className="text-sm text-muted-foreground">
              Commandes en cours de traitement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temps d'Attente Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {metrics.avgWaitTime} min
            </div>
            <p className="text-sm text-muted-foreground">
              Temps avant assignation d'un chauffeur
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};