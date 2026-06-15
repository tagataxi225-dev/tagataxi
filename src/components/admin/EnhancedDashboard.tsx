import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { useTeamStats } from '@/hooks/useTeamStats';
import { formatCurrency } from '@/lib/utils';
import { 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ShoppingBag, 
  Star,
  MapPin,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendDirection = 'neutral', 
  color,
  subtitle 
}) => (
  <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <Badge 
            variant={trendDirection === 'up' ? 'default' : trendDirection === 'down' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {trendDirection === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
            {trendDirection === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
            {trend}
          </Badge>
        )}
      </div>
    </CardContent>
  </Card>
);

export const EnhancedDashboard: React.FC = () => {
  const { stats, loading, error } = useAdminStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Erreur lors du chargement: {error instanceof Error ? error.message : 'Erreur inconnue'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const revenueGrowth = stats.weeklyRevenue > 0 
    ? Math.round(((stats.todayRevenue / (stats.weeklyRevenue / 7)) - 1) * 100)
    : 0;

  const completionRate = stats.completedRides + stats.cancelledRides > 0
    ? Math.round((stats.completedRides / (stats.completedRides + stats.cancelledRides)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Utilisateurs Total"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users className="h-6 w-6" />}
          color="bg-blue-500"
          subtitle="Clients enregistrés"
        />
        
        <StatCard
          title="Chauffeurs"
          value={stats.totalDrivers.toLocaleString()}
          icon={<Car className="h-6 w-6" />}
          color="bg-green-500"
          subtitle={`${stats.onlineDrivers} en ligne`}
          trend={`${stats.onlineDrivers} actifs`}
          trendDirection="up"
        />
        
        <StatCard
          title="Revenus Aujourd'hui"
          value={formatCurrency(stats.todayRevenue)}
          icon={<DollarSign className="h-6 w-6" />}
          color="bg-yellow-500"
          trend={revenueGrowth > 0 ? `+${revenueGrowth}%` : `${revenueGrowth}%`}
          trendDirection={revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'neutral'}
        />
        
        <StatCard
          title="Courses Actives"
          value={stats.activeRides.toLocaleString()}
          icon={<Activity className="h-6 w-6" />}
          color="bg-purple-500"
          subtitle="En cours"
        />
      </div>

      {/* KPI secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Note Moyenne"
          value={`${stats.averageRating}/5`}
          icon={<Star className="h-6 w-6" />}
          color="bg-orange-500"
          subtitle="Satisfaction client"
        />
        
        <StatCard
          title="Taux de Réussite"
          value={`${completionRate}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="bg-emerald-500"
          subtitle="Courses terminées"
        />
        
        <StatCard
          title="Marketplace"
          value={stats.activeProducts.toLocaleString()}
          icon={<ShoppingBag className="h-6 w-6" />}
          color="bg-pink-500"
          subtitle={`${stats.pendingProducts} en attente`}
          trend={stats.pendingProducts > 0 ? "Modération requise" : "À jour"}
          trendDirection={stats.pendingProducts > 0 ? 'down' : 'up'}
        />
        
        <StatCard
          title="Support"
          value={stats.supportTickets.toLocaleString()}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="bg-red-500"
          subtitle={`${stats.pendingTickets} en attente`}
          trend={stats.pendingTickets > 0 ? "Action requise" : "À jour"}
          trendDirection={stats.pendingTickets > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Graphiques et détails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenus mensuels */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus Mensuels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ce mois</span>
                <span className="font-semibold">{formatCurrency(stats.monthlyRevenue)}</span>
              </div>
              <Progress value={75} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cette semaine</span>
                <span className="font-semibold">{formatCurrency(stats.weeklyRevenue)}</span>
              </div>
              <Progress value={60} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Aujourd'hui</span>
                <span className="font-semibold">{formatCurrency(stats.todayRevenue)}</span>
              </div>
              <Progress value={40} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Top zones */}
        <Card>
          <CardHeader>
            <CardTitle>Zones les Plus Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topZones.map((zone, index) => (
                <div key={zone.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-sm text-muted-foreground">{zone.rides} courses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(zone.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activités récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Activités Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                {activity.amount && (
                  <Badge variant="outline">
                    {formatCurrency(activity.amount)}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance système */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Temps de réponse</span>
                <span className="font-semibold">{stats.responseTime}ms</span>
              </div>
              <Progress value={Math.max(0, 100 - stats.responseTime / 10)} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Taux de succès</span>
                <span className="font-semibold">{stats.successRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.successRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résumé Marketplace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Produits actifs</span>
                <span className="font-semibold">{stats.activeProducts}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Commandes ce mois</span>
                <span className="font-semibold">{stats.totalOrders}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Taux de conversion</span>
                <span className="font-semibold">
                  {stats.totalProducts > 0 ? ((stats.completedOrders / stats.totalProducts) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};