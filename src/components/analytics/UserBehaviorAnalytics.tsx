import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface BehaviorMetrics {
  totalBookings: number;
  abandonedBookings: number;
  averageTimePerBooking: number;
  conversionRate: number;
  abandonmentByStep: {
    step: string;
    count: number;
  }[];
  serviceBreakdown: {
    name: string;
    value: number;
  }[];
}

export const UserBehaviorAnalytics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BehaviorMetrics>({
    totalBookings: 0,
    abandonedBookings: 0,
    averageTimePerBooking: 0,
    conversionRate: 0,
    abandonmentByStep: [],
    serviceBreakdown: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Récupérer les réservations transport
      const { data: transportData } = await supabase
        .from('transport_bookings')
        .select('status, created_at, updated_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Récupérer les commandes livraison
      const { data: deliveryData } = await supabase
        .from('delivery_orders')
        .select('status, created_at, updated_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Récupérer les commandes marketplace
      const { data: marketplaceData } = await supabase
        .from('marketplace_orders')
        .select('status, created_at, updated_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const allBookings = [
        ...(transportData || []).map(b => ({ ...b, service: 'Transport' })),
        ...(deliveryData || []).map(b => ({ ...b, service: 'Livraison' })),
        ...(marketplaceData || []).map(b => ({ ...b, service: 'Marketplace' }))
      ];

      const totalBookings = allBookings.length;
      const completedBookings = allBookings.filter(b => 
        ['completed', 'delivered'].includes(b.status)
      ).length;
      const abandonedBookings = allBookings.filter(b => 
        ['cancelled', 'failed'].includes(b.status)
      ).length;

      // Calculer temps moyen par booking
      const avgTime = allBookings.reduce((acc, booking) => {
        const start = new Date(booking.created_at).getTime();
        const end = new Date(booking.updated_at).getTime();
        return acc + (end - start);
      }, 0) / (allBookings.length || 1);

      // Abandons par étape (simulé)
      const abandonmentByStep = [
        { step: 'Sélection service', count: Math.floor(abandonedBookings * 0.4) },
        { step: 'Détails commande', count: Math.floor(abandonedBookings * 0.3) },
        { step: 'Paiement', count: Math.floor(abandonedBookings * 0.2) },
        { step: 'Confirmation', count: Math.floor(abandonedBookings * 0.1) }
      ];

      // Breakdown par service
      const serviceBreakdown = [
        { 
          name: 'Transport', 
          value: transportData?.length || 0 
        },
        { 
          name: 'Livraison', 
          value: deliveryData?.length || 0 
        },
        { 
          name: 'Marketplace', 
          value: marketplaceData?.length || 0 
        }
      ];

      setMetrics({
        totalBookings,
        abandonedBookings,
        averageTimePerBooking: avgTime / 1000 / 60, // en minutes
        conversionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        abandonmentByStep,
        serviceBreakdown: serviceBreakdown.filter(s => s.value > 0)
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">30 derniers jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Commandes complétées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.averageTimePerBooking)} min</div>
            <p className="text-xs text-muted-foreground">Par commande</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abandons</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.abandonedBookings}</div>
            <p className="text-xs text-muted-foreground">Annulations/Échecs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Abandons par étape */}
        <Card>
          <CardHeader>
            <CardTitle>Points de friction</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.abandonmentByStep}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Breakdown par service */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par service</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.serviceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {metrics.serviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
