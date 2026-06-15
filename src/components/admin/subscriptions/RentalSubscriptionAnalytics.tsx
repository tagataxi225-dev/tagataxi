import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePartnerRentalSubscriptions } from '@/hooks/usePartnerRentalSubscriptions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

export const RentalSubscriptionAnalytics = () => {
  const { subscriptions, stats, isLoading } = usePartnerRentalSubscriptions();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const statusData = [
    { name: 'Actifs', value: subscriptions.filter(s => s.status === 'active').length, color: '#10b981' },
    { name: 'Expirés', value: subscriptions.filter(s => s.status === 'expired').length, color: '#ef4444' },
    { name: 'Annulés', value: subscriptions.filter(s => s.status === 'cancelled').length, color: '#6b7280' },
    { name: 'En attente', value: subscriptions.filter(s => s.status === 'pending').length, color: '#f59e0b' }
  ];

  // Revenue by plan
  const planRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((acc, sub) => {
      const planName = `Plan ${sub.plan_id.slice(0, 8)}`;
      const price = 30000;
      
      if (!acc[planName]) {
        acc[planName] = { name: planName, revenue: 0, count: 0 };
      }
      acc[planName].revenue += price;
      acc[planName].count += 1;
      return acc;
    }, {} as Record<string, { name: string; revenue: number; count: number }>);

  const planRevenueData = Object.values(planRevenue);

  // Monthly subscription trend (simulated)
  const monthlyTrend = [
    { month: 'Jan', subscriptions: 15, revenue: 450000 },
    { month: 'Fév', subscriptions: 18, revenue: 540000 },
    { month: 'Mar', subscriptions: 22, revenue: 660000 },
    { month: 'Avr', subscriptions: 25, revenue: 750000 },
    { month: 'Mai', subscriptions: 28, revenue: 840000 },
    { month: 'Juin', subscriptions: stats?.activeSubscriptions || 30, revenue: stats?.monthlyRevenue || 900000 }
  ];

  // Expiration alerts
  const expiringSubscriptions = subscriptions.filter(sub => {
    if (sub.status !== 'active') return false;
    const endDate = new Date(sub.end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.monthlyRevenue?.toLocaleString()} CDF
            </div>
            <p className="text-xs text-muted-foreground">
              +12% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Renouvellement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">85%</div>
            <p className="text-xs text-muted-foreground">
              Moyenne des 6 derniers mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée Moyenne</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32 jours</div>
            <p className="text-xs text-muted-foreground">
              Durée moyenne des abonnements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Expiration</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {expiringSubscriptions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Expirent dans 30 jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Abonnements</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="subscriptions" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Abonnements"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenus par Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={planRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `${value.toLocaleString()} CDF` : value,
                    name === 'revenue' ? 'Revenus' : 'Nombre'
                  ]}
                />
                <Bar dataKey="revenue" fill="#10b981" name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Abonnements Expirant Bientôt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringSubscriptions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun abonnement n'expire dans les 30 prochains jours
                </p>
              ) : (
                expiringSubscriptions.slice(0, 5).map((sub) => {
                  const endDate = new Date(sub.end_date);
                  const now = new Date();
                  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Partenaire #{sub.partner_id.slice(0, 8)}</div>
                        <div className="text-sm text-muted-foreground">
                          Véhicule #{sub.vehicle_id.slice(0, 8)}
                        </div>
                      </div>
                      <Badge variant={daysUntilExpiry <= 7 ? 'destructive' : 'outline'}>
                        {daysUntilExpiry} jour{daysUntilExpiry !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  );
                })
              )}
              {expiringSubscriptions.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{expiringSubscriptions.length - 5} autres abonnements...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Revenus</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} CDF`, 'Revenus']} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Revenus"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};