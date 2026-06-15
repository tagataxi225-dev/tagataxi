import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, ShoppingBag, Star, Clock } from 'lucide-react';
import { RevenueChart, TopDishesChart } from '@/components/restaurant/analytics/RevenueChart';
import { motion } from 'framer-motion';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';


interface AnalyticsData {
  totalOrders: number;
  monthlyRevenue: number;
  satisfactionRate: number;
  avgOrderValue: number;
  revenueHistory: { date: string; revenue: number; orders: number }[];
  topDishes: { name: string; orders: number; revenue: number }[];
}

interface ModernRestaurantAnalyticsProps {
  restaurantId?: string;
}

export default function ModernRestaurantAnalytics({ restaurantId: propRestaurantId }: ModernRestaurantAnalyticsProps = {}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalOrders: 0,
    monthlyRevenue: 0,
    satisfactionRate: 0,
    avgOrderValue: 0,
    revenueHistory: [],
    topDishes: [],
  });

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await loadAnalytics();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/restaurant/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('restaurant_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;
      setRestaurantId(profile.id);

      // Charger les stats du mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase
        .from('food_orders')
        .select('total_amount, created_at, items, status')
        .eq('restaurant_id', profile.id)
        .gte('created_at', startOfMonth.toISOString());

      if (orders && orders.length > 0) {
        const totalOrders = orders.length;
        const monthlyRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const avgOrderValue = totalOrders > 0 ? Math.round(monthlyRevenue / totalOrders) : 0;

        // Revenue history (7 derniers jours)
        const revenueHistory = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          date.setHours(0, 0, 0, 0);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayOrders = orders.filter(o => 
            o.created_at.split('T')[0] === dateStr
          );
          
          return {
            date: dateStr,
            revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
            orders: dayOrders.length,
          };
        });

        // Top dishes
        const dishCounts: { [key: string]: { orders: number; revenue: number } } = {};
        orders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            (order.items as any[]).forEach((item: any) => {
              if (!dishCounts[item.name]) {
                dishCounts[item.name] = { orders: 0, revenue: 0 };
              }
              dishCounts[item.name].orders += item.quantity;
              dishCounts[item.name].revenue += item.price * item.quantity;
            });
          }
        });

        const topDishes = Object.entries(dishCounts)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 5);

        setAnalytics({
          totalOrders,
          monthlyRevenue,
          satisfactionRate: 92, // Mock data
          avgOrderValue,
          revenueHistory,
          topDishes,
        });
      } else {
        // Données de démonstration
        console.log('⚠️ Aucune commande trouvée, affichage de données de démo');
        
        setAnalytics({
          totalOrders: 47,
          monthlyRevenue: 285000, // 285 000 CDF
          satisfactionRate: 92,
          avgOrderValue: 6063, // 6 063 CDF
          revenueHistory: [
            { date: '2025-11-01', revenue: 38000, orders: 6 },
            { date: '2025-11-02', revenue: 42000, orders: 7 },
            { date: '2025-11-03', revenue: 35000, orders: 5 },
            { date: '2025-11-04', revenue: 48000, orders: 8 },
            { date: '2025-11-05', revenue: 51000, orders: 9 },
            { date: '2025-11-06', revenue: 39000, orders: 6 },
            { date: '2025-11-07', revenue: 32000, orders: 6 },
          ],
          topDishes: [
            { name: 'Poulet Braisé + Fufu', orders: 23, revenue: 69000 },
            { name: 'Tilapia Grillé', orders: 18, revenue: 54000 },
            { name: 'Pondu + Chikwangue', orders: 15, revenue: 45000 },
            { name: 'Saka-Saka', orders: 12, revenue: 36000 },
            { name: 'Makayabu + Riz', orders: 9, revenue: 27000 },
          ],
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Commandes totales',
      value: analytics.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Revenus du mois',
      value: `${analytics.monthlyRevenue.toLocaleString()} CDF`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Panier moyen',
      value: `${analytics.avgOrderValue.toLocaleString()} CDF`,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Satisfaction',
      value: `${analytics.satisfactionRate}%`,
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  // handleRefresh moved to top with other hooks

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
    <div className="space-y-6">
      {/* Header */}
      {/* Header soft-modern */}
      <div className="rounded-2xl bg-card border border-border/40 p-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Statistiques</h1>
          {analytics.totalOrders === 47 && (
            <Badge variant="secondary" className="text-xs">DÉMO</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Insights détaillés de votre activité</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden transition-all hover:shadow-lg">
                <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardHeader className="pb-2">
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{kpi.value}</span>
                    <div className={`p-3 rounded-xl ${kpi.iconBg}`}>
                      <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <RevenueChart data={analytics.revenueHistory} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <TopDishesChart data={analytics.topDishes} />
        </motion.div>
      </div>

      {/* Peak hours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Heures de pointe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {['12h', '13h', '14h', '19h', '20h', '21h'].map((hour, index) => (
                <div key={hour} className="text-center">
                  <Badge variant="outline" className="text-base px-4 py-2">
                    {hour}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
      </Card>
      </motion.div>
    </div>
    </PullToRefresh>
  );
}
