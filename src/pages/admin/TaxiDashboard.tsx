/**
 * 📊 TAXI ADMIN DASHBOARD - Phase 4
 * Dashboard complet pour monitoring du service taxi
 * Métriques temps réel + carte des chauffeurs + analytics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Car,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  MapPin,
  Activity,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LiveDriversDashboard from '@/components/transport/LiveDriversDashboard';
import { taxiMetrics } from '@/services/taxiMetricsService';

interface DashboardStats {
  total_bookings: number;
  active_bookings: number;
  completed_today: number;
  total_revenue: number;
  avg_trip_time: number | null;
  drivers_online: number;
  drivers_available: number;
  success_rate: number;
}

export default function TaxiDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [topDestinations, setTopDestinations] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    
    // Refresh toutes les 30 secondes
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Stats globales
      const { data: bookings, error: bookingsError } = await supabase
        .from('transport_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // 2. Chauffeurs en ligne
      const { data: drivers, error: driversError } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('is_online', true)
        .gte('last_ping', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      if (driversError) throw driversError;

      // 3. Temps moyen de course (dernières 24h)
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: completedTrips } = await supabase
        .from('transport_bookings')
        .select('created_at, completed_at')
        .eq('status', 'completed')
        .gte('created_at', since24h)
        .not('completed_at', 'is', null);

      const avgTripTime = (() => {
        const valid = (completedTrips ?? []).filter(b => b.completed_at);
        if (valid.length === 0) return null;
        const totalMs = valid.reduce((sum, b) => {
          return sum + (new Date(b.completed_at!).getTime() - new Date(b.created_at).getTime());
        }, 0);
        return Math.round(totalMs / valid.length / 60000);
      })();

      // 4. Métriques client-side
      const metrics = await taxiMetrics.getMetricsSummary(period);

      // Calculer les stats
      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const bookingsToday = bookings?.filter(b => 
        new Date(b.created_at) >= startOfToday
      ) || [];

      const completedToday = bookingsToday.filter(b => b.status === 'completed');
      const activeBookings = bookings?.filter(b => 
        ['pending', 'driver_assigned', 'driver_en_route', 'pickup', 'in_progress'].includes(b.status)
      ) || [];

      const totalRevenue = completedToday.reduce((sum, b) => 
        sum + (b.actual_price || b.estimated_price || 0), 0
      );

      const driversOnline = drivers?.length || 0;
      const driversAvailable = drivers?.filter(d => d.is_available).length || 0;

      // Taux de succès
      const totalAttempts = bookingsToday.length;
      const successfulAssignments = bookingsToday.filter(b => b.driver_id).length;
      const successRate = totalAttempts > 0 
        ? Math.round((successfulAssignments / totalAttempts) * 100)
        : 0;

      setStats({
        total_bookings: bookings?.length || 0,
        active_bookings: activeBookings.length,
        completed_today: completedToday.length,
        total_revenue: totalRevenue,
        avg_trip_time: avgTripTime,
        drivers_online: driversOnline,
        drivers_available: driversAvailable,
        success_rate: successRate
      });

      // 5. Réservations récentes
      setRecentBookings(bookings?.slice(0, 10) || []);

      // 6. Destinations populaires
      const destinationCounts = new Map<string, number>();
      bookings?.forEach(b => {
        const dest = b.destination;
        destinationCounts.set(dest, (destinationCounts.get(dest) || 0) + 1);
      });
      
      const topDests = Array.from(destinationCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([destination, count]) => ({ destination, count }));
      
      setTopDestinations(topDests);

    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' CDF';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      driver_assigned: 'default',
      in_progress: 'default',
      completed: 'default',
      cancelled: 'destructive'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Taxi</h1>
          <p className="text-muted-foreground">Monitoring en temps réel</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            onClick={() => setPeriod('today')}
            size="sm"
          >
            Aujourd'hui
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
            size="sm"
          >
            7 jours
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
            size="sm"
          >
            30 jours
          </Button>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glassmorphism">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réservations actives</p>
                <p className="text-3xl font-bold">{stats?.active_bookings || 0}</p>
              </div>
              <Car className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chauffeurs disponibles</p>
                <p className="text-3xl font-bold text-green-500">
                  {stats?.drivers_available || 0}
                  <span className="text-sm text-muted-foreground ml-2">
                    / {stats?.drivers_online || 0}
                  </span>
                </p>
              </div>
              <Users className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenus aujourd'hui</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
                <p className="text-3xl font-bold">{stats?.success_rate || 0}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="drivers">Chauffeurs</TabsTrigger>
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Réservations récentes */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Réservations récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentBookings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune réservation
                    </p>
                  ) : (
                    recentBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {booking.pickup_location.substring(0, 30)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            → {booking.destination.substring(0, 30)}...
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(booking.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(booking.status)}
                          <p className="text-sm font-bold mt-1">
                            {formatCurrency(booking.estimated_price)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top destinations */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Destinations populaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topDestinations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune donnée
                    </p>
                  ) : (
                    topDestinations.map((dest, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{dest.destination}</p>
                          <p className="text-xs text-muted-foreground">
                            {dest.count} courses
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drivers">
          <LiveDriversDashboard 
            userLocation={null}
            city="Kinshasa"
          />
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle>Toutes les réservations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">#{booking.id.slice(-6)}</Badge>
                        {getStatusBadge(booking.status)}
                      </div>
                      <p className="font-medium">{booking.pickup_location}</p>
                      <p className="text-sm text-muted-foreground">
                        → {booking.destination}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(booking.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatCurrency(booking.actual_price || booking.estimated_price)}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {booking.vehicle_type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-lg">Temps moyen de course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {stats?.avg_trip_time != null ? `${stats.avg_trip_time} min` : 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-lg">Total réservations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{stats?.total_bookings || 0}</p>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-lg">Complétées aujourd'hui</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-500">
                  {stats?.completed_today || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
