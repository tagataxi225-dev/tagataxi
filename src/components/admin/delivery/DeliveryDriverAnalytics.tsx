import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Package, Star, Clock, Award } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DeliveryDriverAnalytics = () => {
  // Fetch delivery drivers performance
  const { data: driversStats, isLoading } = useQuery({
    queryKey: ['adminDeliveryDriversStats'],
    queryFn: async () => {
      // Fetch delivery drivers with their stats
      const { data: drivers, error: driversError } = await supabase
        .from('chauffeurs')
        .select('id, display_name, phone_number, is_active, verification_status')
        .eq('service_type', 'delivery')
        .eq('is_active', true)
        .eq('verification_status', 'verified');

      if (driversError) throw driversError;

      // Fetch delivery stats for each driver
      const driversWithStats = await Promise.all(
        (drivers || []).map(async (driver) => {
          const { data: deliveries } = await supabase
            .from('delivery_orders')
            .select('id, status, created_at, delivered_at, actual_price')
            .eq('driver_id', driver.id);

          const totalDeliveries = deliveries?.length || 0;
          const completedDeliveries = deliveries?.filter(d => d.status === 'delivered').length || 0;
          const totalRevenue = deliveries
            ?.filter(d => d.status === 'delivered')
            .reduce((sum, d) => sum + (Number(d.actual_price) || 0), 0) || 0;

          // Calculate average delivery time
          const deliveryTimes = deliveries?.filter(d => d.delivered_at && d.created_at) || [];
          const avgDeliveryTime = deliveryTimes.length > 0
            ? deliveryTimes.reduce((sum, d) => {
                const time = new Date(d.delivered_at!).getTime() - new Date(d.created_at).getTime();
                return sum + time;
              }, 0) / deliveryTimes.length / 1000 / 60 // Convert to minutes
            : 0;

          const successRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries * 100) : 0;

          return {
            ...driver,
            totalDeliveries,
            completedDeliveries,
            totalRevenue,
            avgDeliveryTime: Math.round(avgDeliveryTime),
            successRate: successRate.toFixed(1)
          };
        })
      );

      // Sort by total deliveries
      return driversWithStats.sort((a, b) => b.totalDeliveries - a.totalDeliveries);
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Prepare chart data
  const chartData = driversStats?.slice(0, 10).map(driver => ({
    name: driver.display_name?.substring(0, 15) || 'N/A',
    deliveries: driver.totalDeliveries,
    revenue: driver.totalRevenue
  })) || [];

  const totalStats = driversStats?.reduce((acc, driver) => {
    acc.totalDeliveries += driver.totalDeliveries;
    acc.totalRevenue += driver.totalRevenue;
    acc.avgSuccessRate += parseFloat(driver.successRate);
    return acc;
  }, { totalDeliveries: 0, totalRevenue: 0, avgSuccessRate: 0 });

  const avgSuccessRate = driversStats && driversStats.length > 0
    ? (totalStats!.avgSuccessRate / driversStats.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livreurs Actifs</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{driversStats?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Vérifiés et actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Livraisons</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats?.totalDeliveries || 0}</div>
            <p className="text-xs text-muted-foreground">Tous livreurs confondus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats?.totalRevenue.toLocaleString() || 0} CDF</div>
            <p className="text-xs text-muted-foreground">Livraisons complétées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès Moyen</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{avgSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">Performance globale</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top 10 Livreurs - Performances
          </CardTitle>
          <CardDescription>
            Classement par nombre de livraisons complétées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="deliveries" fill="#8b5cf6" name="Livraisons" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Drivers Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Analytics Détaillées par Livreur
          </CardTitle>
          <CardDescription>
            Performance individuelle des livreurs de livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : driversStats && driversStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classement</TableHead>
                  <TableHead>Livreur</TableHead>
                  <TableHead>Total Livraisons</TableHead>
                  <TableHead>Complétées</TableHead>
                  <TableHead>Taux Succès</TableHead>
                  <TableHead>Temps Moyen</TableHead>
                  <TableHead>Revenus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driversStats.map((driver, index) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      {index === 0 && <Badge className="bg-yellow-500">🥇 1er</Badge>}
                      {index === 1 && <Badge className="bg-gray-400">🥈 2e</Badge>}
                      {index === 2 && <Badge className="bg-orange-600">🥉 3e</Badge>}
                      {index > 2 && <span className="text-sm text-muted-foreground">#{index + 1}</span>}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{driver.display_name}</div>
                        <div className="text-xs text-muted-foreground">{driver.phone_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{driver.totalDeliveries}</Badge>
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {driver.completedDeliveries}
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${parseFloat(driver.successRate) > 90 ? 'text-green-600' : parseFloat(driver.successRate) > 70 ? 'text-orange-600' : 'text-red-600'}`}>
                        {driver.successRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{driver.avgDeliveryTime} min</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {driver.totalRevenue.toLocaleString()} CDF
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              Aucun livreur actif trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
