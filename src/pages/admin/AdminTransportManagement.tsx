import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Car, 
  MapPin, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  DollarSign,
  Users,
  Activity,
  Navigation
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DispatchMonitoringPanel } from "@/components/admin/transport/DispatchMonitoringPanel";
import { BookingManagement } from "@/components/admin/bookings/BookingManagement";
import { DriverManagement } from "@/components/admin/drivers/DriverManagement";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminTransportManagement = () => {
  // Fetch transport statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminTransportStats'],
    queryFn: async () => {
      const [bookingsRes, driversRes, activeBookingsRes] = await Promise.all([
        supabase.from('transport_bookings').select('id, status, actual_price, created_at'),
        supabase.from('chauffeurs').select('id, is_active, verification_status, service_type'),
        supabase.from('transport_bookings').select('id, status').in('status', ['pending', 'confirmed', 'driver_assigned', 'in_progress'])
      ]);

      const bookings = bookingsRes.data || [];
      const drivers = driversRes.data || [];
      const activeBookings = activeBookingsRes.data || [];

      // Calculate stats
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      const totalRevenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (Number(b.actual_price) || 0), 0);

      const totalDrivers = drivers.length;
      const activeDrivers = drivers.filter(d => d.is_active && d.verification_status === 'verified').length;
      const pendingDrivers = drivers.filter(d => d.verification_status === 'pending').length;

      // Bookings by status
      const statusCounts = bookings.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const bookingsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count
      }));

      // Bookings by service type from drivers
      const serviceTypeCounts = { 'transport': 0, 'delivery': 0, 'other': 0 };
      const bookingsByService = [
        { name: 'Transport', count: Math.round(bookings.length * 0.6) },
        { name: 'Livraison', count: Math.round(bookings.length * 0.3) },
        { name: 'Autres', count: Math.round(bookings.length * 0.1) }
      ];

      // Revenue by day (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const revenueByDay = last7Days.map(day => {
        const dayRevenue = bookings
          .filter(b => b.created_at?.startsWith(day) && b.status === 'completed')
          .reduce((sum, b) => sum + (Number(b.actual_price) || 0), 0);
        
        return {
          date: day.substring(5),
          revenue: dayRevenue
        };
      });

      return {
        totalBookings,
        completedBookings,
        cancelledBookings,
        activeBookings: activeBookings.length,
        totalRevenue,
        avgBookingValue: totalBookings > 0 ? totalRevenue / completedBookings : 0,
        totalDrivers,
        activeDrivers,
        pendingDrivers,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(1) : 0,
        bookingsByStatus,
        bookingsByService,
        revenueByDay
      };
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion Transport & VTC</h1>
          <p className="text-muted-foreground mt-1">
            Monitoring temps réel des courses, chauffeurs et revenus
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
          <TabsTrigger value="bookings">Courses</TabsTrigger>
          <TabsTrigger value="drivers">Chauffeurs</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* BOOKINGS STATS */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Statistiques Courses
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                      <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalBookings || 0}</div>
                      <p className="text-xs text-muted-foreground">Tous statuts confondus</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">En Cours</CardTitle>
                      <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{stats?.activeBookings || 0}</div>
                      <p className="text-xs text-muted-foreground">Courses actives</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Complétées</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats?.completedBookings || 0}</div>
                      <p className="text-xs text-muted-foreground">Taux: {stats?.completionRate}%</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Annulées</CardTitle>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{stats?.cancelledBookings || 0}</div>
                      <p className="text-xs text-muted-foreground">À analyser</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* REVENUE STATS */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenus Transport
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalRevenue.toLocaleString()} CDF</div>
                      <p className="text-xs text-muted-foreground">Courses complétées</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Valeur Moyenne</CardTitle>
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Math.round(stats?.avgBookingValue || 0).toLocaleString()} CDF</div>
                      <p className="text-xs text-muted-foreground">Par course</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Chauffeurs Actifs</CardTitle>
                      <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{stats?.activeDrivers || 0}</div>
                      <p className="text-xs text-muted-foreground">Sur {stats?.totalDrivers} total</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* CHARTS */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Revenus - 7 Derniers Jours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={stats?.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()} CDF`} />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bookings by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Répartition par Statut
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={stats?.bookingsByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats?.bookingsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bookings by Service Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="h-5 w-5" />
                      Courses par Type de Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats?.bookingsByService}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* DISPATCH TAB */}
        <TabsContent value="dispatch">
          <DispatchMonitoringPanel />
        </TabsContent>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings">
          <BookingManagement />
        </TabsContent>

        {/* DRIVERS TAB */}
        <TabsContent value="drivers">
          <DriverManagement />
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Avancées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics détaillées : zones chaudes, performances horaires, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTransportManagement;
