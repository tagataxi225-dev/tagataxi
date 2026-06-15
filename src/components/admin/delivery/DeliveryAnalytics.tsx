import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart 
} from 'recharts';
import { 
  TrendingUp, 
  MapPin, 
  Clock, 
  Zap,
  Package,
  Timer
} from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const DeliveryAnalytics: React.FC = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['deliveryAnalytics'],
    queryFn: async () => {
      const { data: deliveries, error } = await supabase
        .from('delivery_orders')
        .select('id, status, delivery_type, city, created_at, delivered_at, actual_price, estimated_price');

      if (error) throw error;

      // Deliveries by type
      const typeCount = (deliveries || []).reduce((acc, d) => {
        const type = d.delivery_type || 'flex';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const deliveriesByType = [
        { name: 'Flash', value: typeCount['flash'] || 0, color: 'hsl(var(--chart-1))' },
        { name: 'Flex', value: typeCount['flex'] || 0, color: 'hsl(var(--chart-2))' },
        { name: 'Maxicharge', value: typeCount['maxicharge'] || 0, color: 'hsl(var(--chart-3))' },
      ];

      // Deliveries by city
      const cityCount = (deliveries || []).reduce((acc, d) => {
        const city = d.city || 'Non spécifiée';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const deliveriesByCity = Object.entries(cityCount)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .sort((a, b) => b.value - a.value);

      // Revenue trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const revenueTrend = last7Days.map(day => {
        const dayDeliveries = (deliveries || []).filter(
          d => d.created_at?.startsWith(day) && d.status === 'delivered'
        );
        return {
          date: day.substring(5),
          revenue: dayDeliveries.reduce((sum, d) => sum + (d.actual_price || d.estimated_price || 0), 0),
          count: dayDeliveries.length,
        };
      });

      // Deliveries by status
      const statusCount = (deliveries || []).reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const deliveriesByStatus = Object.entries(statusCount).map(([name, value]) => ({
        name: name === 'delivered' ? 'Livrées' : 
              name === 'pending' ? 'En attente' :
              name === 'cancelled' ? 'Annulées' :
              name === 'in_transit' ? 'En transit' :
              name === 'picked_up' ? 'Récupérées' :
              name === 'driver_assigned' ? 'Assignées' :
              name === 'confirmed' ? 'Confirmées' : name,
        value,
      }));

      // Performance stats
      const deliveredDeliveries = (deliveries || []).filter(d => 
        d.status === 'delivered' && d.created_at && d.delivered_at
      );

      const avgDeliveryTimes = {
        flash: 0,
        flex: 0,
        maxicharge: 0,
      };

      ['flash', 'flex', 'maxicharge'].forEach(type => {
        const typeDeliveries = deliveredDeliveries.filter(d => d.delivery_type === type);
        if (typeDeliveries.length > 0) {
          const totalTime = typeDeliveries.reduce((sum, d) => {
            const start = new Date(d.created_at).getTime();
            const end = new Date(d.delivered_at!).getTime();
            return sum + (end - start);
          }, 0);
          avgDeliveryTimes[type as keyof typeof avgDeliveryTimes] = Math.round(totalTime / typeDeliveries.length / 60000);
        }
      });

      return {
        deliveriesByType,
        deliveriesByCity,
        revenueTrend,
        deliveriesByStatus,
        avgDeliveryTimes,
        totalDeliveries: deliveries?.length || 0,
        totalRevenue: (deliveries || [])
          .filter(d => d.status === 'delivered')
          .reduce((sum, d) => sum + (d.actual_price || d.estimated_price || 0), 0),
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader>
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[250px] bg-muted/30 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Temps moyen Flash
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {analyticsData?.avgDeliveryTimes.flash || 0} min
            </div>
            <p className="text-xs text-muted-foreground">Livraison express</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Temps moyen Flex
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData?.avgDeliveryTimes.flex || 0} min
            </div>
            <p className="text-xs text-muted-foreground">Livraison standard</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Temps moyen Maxicharge
            </CardTitle>
            <Timer className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analyticsData?.avgDeliveryTimes.maxicharge || 0} min
            </div>
            <p className="text-xs text-muted-foreground">Gros colis</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenus - 7 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analyticsData?.revenueTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value) => `${Number(value).toLocaleString()} CDF`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deliveries by Type */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Répartition par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData?.deliveriesByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {analyticsData?.deliveriesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deliveries by City */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Livraisons par ville
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData?.deliveriesByCity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deliveries by Status */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Répartition par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData?.deliveriesByStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={80} />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
