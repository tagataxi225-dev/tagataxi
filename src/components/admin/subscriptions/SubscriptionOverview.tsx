import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUnifiedSubscriptions } from "@/hooks/useUnifiedSubscriptions";
import { SubscriptionStatCard } from './SubscriptionStatCard';
import { ServiceTypeBadge } from './ServiceTypeBadge';
import { RidesProgressBar } from './RidesProgressBar';
import { 
  Users, DollarSign, TrendingUp, AlertTriangle, 
  Calendar, Zap, Package, Target, Award, Activity
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export const SubscriptionOverview = () => {
  const { driverSubscriptions, rentalSubscriptions, stats, loading } = useUnifiedSubscriptions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Statistiques avancées
  const expiringThisWeek = driverSubscriptions.filter(sub => {
    const endDate = new Date(sub.end_date);
    return sub.status === 'active' && endDate <= weekFromNow && endDate > now;
  });

  const recentSubs = driverSubscriptions.filter(sub => {
    const created = new Date(sub.created_at);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return created >= weekAgo;
  });

  const autoRenewCount = driverSubscriptions.filter(
    sub => sub.status === 'active' && sub.auto_renew
  ).length;

  const totalRidesRemaining = driverSubscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + (sub.rides_remaining || 0), 0);

  // Données pour les graphiques
  const serviceTypeData = [
    { 
      name: '🚗 Taxi', 
      value: driverSubscriptions.filter(s => s.service_type === 'transport' && s.status === 'active').length,
      color: '#3b82f6'
    },
    { 
      name: '🚚 Livraison', 
      value: driverSubscriptions.filter(s => s.service_type === 'delivery' && s.status === 'active').length,
      color: '#f97316'
    },
    { 
      name: '🚗🚚 Les deux', 
      value: driverSubscriptions.filter(s => s.service_type === 'both' && s.status === 'active').length,
      color: '#8b5cf6'
    }
  ];

  const statusData = [
    { name: 'Actifs', value: stats?.totalActiveSubscriptions || 0, color: '#10b981' },
    { name: 'Expirés', value: driverSubscriptions.filter(s => s.status === 'expired').length, color: '#ef4444' },
    { name: 'Annulés', value: driverSubscriptions.filter(s => s.status === 'cancelled').length, color: '#6b7280' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Alert pour expirations */}
      {expiringThisWeek.length > 0 && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{expiringThisWeek.length}</strong> abonnement{expiringThisWeek.length > 1 ? 's' : ''} expire{expiringThisWeek.length > 1 ? 'nt' : ''} cette semaine - Rappels recommandés
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs principaux avec nouveaux composants */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <SubscriptionStatCard
          title="Abonnements Actifs"
          value={String(stats?.totalActiveSubscriptions || 0)}
          icon={Users}
          description={`${stats?.driverSubscriptions || 0} chauffeurs + ${stats?.rentalSubscriptions || 0} location`}
          trend={{ value: 12, label: 'vs mois dernier' }}
          borderColor="#3b82f6"
        />

        <SubscriptionStatCard
          title="Revenus Mensuels"
          value={`${((stats?.monthlyRevenue || 0) as number).toLocaleString()} CDF`}
          icon={DollarSign}
          description="Revenus récurrents mensuels"
          trend={{ value: 8, label: 'vs mois dernier' }}
          borderColor="#10b981"
        />

        <SubscriptionStatCard
          title="Courses Restantes"
          value={String(totalRidesRemaining)}
          icon={Zap}
          description="Total tickets disponibles"
          badge={{ text: '🎫 Actifs', variant: 'secondary' }}
          borderColor="#f97316"
        />

        <SubscriptionStatCard
          title="Auto-Renouvellement"
          value={`${autoRenewCount}/${stats?.totalActiveSubscriptions || 0}`}
          icon={Target}
          description={`${stats?.totalActiveSubscriptions ? Math.round((autoRenewCount / stats.totalActiveSubscriptions) * 100) : 0}% activé`}
          borderColor="#8b5cf6"
        />
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Répartition par Type de Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} className="md:h-[250px]">
              <PieChart>
                <Pie
                  data={serviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : null
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Répartition par Statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} className="md:h-[250px]">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tableaux détaillés */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Abonnements Expirant Cette Semaine
            </CardTitle>
            <CardDescription>
              {expiringThisWeek.length} abonnement{expiringThisWeek.length > 1 ? 's' : ''} nécessite{expiringThisWeek.length > 1 ? 'nt' : ''} attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringThisWeek.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ✅ Aucun abonnement n'expire cette semaine
                </p>
              ) : (
                expiringThisWeek.slice(0, 5).map((sub) => {
                  const endDate = new Date(sub.end_date);
                  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium">
                          {sub.chauffeurs?.display_name || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <ServiceTypeBadge serviceType={sub.service_type || 'transport'} size="sm" />
                          <span>{sub.subscription_plans?.name}</span>
                        </div>
                        <RidesProgressBar 
                          ridesRemaining={sub.rides_remaining || 0}
                          ridesIncluded={sub.subscription_plans?.rides_included || 0}
                          size="sm"
                          className="mt-2"
                        />
                      </div>
                      <Badge variant={daysLeft <= 2 ? 'destructive' : 'outline'} className="ml-3">
                        {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  );
                })
              )}
              {expiringThisWeek.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{expiringThisWeek.length - 5} autre{expiringThisWeek.length - 5 > 1 ? 's' : ''}...
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              Nouveaux Abonnements (7 jours)
            </CardTitle>
            <CardDescription>
              {recentSubs.length} nouveau{recentSubs.length > 1 ? 'x' : ''} abonné{recentSubs.length > 1 ? 's' : ''} cette semaine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun nouvel abonnement cette semaine
                </p>
              ) : (
                recentSubs.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium">
                        {sub.chauffeurs?.display_name || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <ServiceTypeBadge serviceType={sub.service_type || 'transport'} size="sm" />
                        <span>{sub.subscription_plans?.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Créé le {new Date(sub.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {typeof sub.subscription_plans?.price === 'number' 
                          ? sub.subscription_plans.price.toLocaleString() 
                          : '0'} CDF
                      </div>
                      {sub.auto_renew && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          🔄 Auto-renew
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
              {recentSubs.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{recentSubs.length - 5} autre{recentSubs.length - 5 > 1 ? 's' : ''}...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};