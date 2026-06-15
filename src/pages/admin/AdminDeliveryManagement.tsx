import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, BarChart3, Users, LayoutDashboard } from "lucide-react";
import { DeliveryManagement, DeliveryAnalytics } from "@/components/admin/delivery";
import { DeliveryDriverAnalytics } from "@/components/admin/delivery/DeliveryDriverAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const AdminDeliveryManagement = () => {
  const { data: overviewStats, isLoading } = useQuery({
    queryKey: ['deliveryOverview'],
    queryFn: async () => {
      const { data: deliveries } = await supabase
        .from('delivery_orders')
        .select('id, status, actual_price, estimated_price, delivery_type, created_at');

      const total = deliveries?.length || 0;
      const delivered = deliveries?.filter(d => d.status === 'delivered').length || 0;
      const active = deliveries?.filter(d => ['confirmed', 'driver_assigned', 'picked_up', 'in_transit'].includes(d.status)).length || 0;
      const revenue = deliveries?.filter(d => d.status === 'delivered').reduce((s, d) => s + (d.actual_price || d.estimated_price || 0), 0) || 0;

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const trend = last7Days.map(day => ({
        date: day.substring(5),
        count: deliveries?.filter(d => d.created_at?.startsWith(day)).length || 0,
      }));

      return { total, delivered, active, revenue, trend, successRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : 0 };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion Livraisons</h1>
        <p className="text-muted-foreground text-sm">Suivi et gestion des livraisons</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="gap-2">
            <Package className="h-4 w-4" />
            Livraisons
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-2">
            <Users className="h-4 w-4" />
            Livreurs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewStats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{overviewStats?.active || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Livrées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{overviewStats?.delivered || 0}</div>
                <p className="text-xs text-muted-foreground">Taux: {overviewStats?.successRate}%</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{(overviewStats?.revenue || 0).toLocaleString()} CDF</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Tendance - 7 derniers jours</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={overviewStats?.trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliveries">
          <DeliveryManagement />
        </TabsContent>

        <TabsContent value="drivers">
          <DeliveryDriverAnalytics />
        </TabsContent>

        <TabsContent value="analytics">
          <DeliveryAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDeliveryManagement;
