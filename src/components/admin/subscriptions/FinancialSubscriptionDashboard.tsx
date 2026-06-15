import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnifiedSubscriptions } from '@/hooks/useUnifiedSubscriptions';
import { TrendingUp, DollarSign, Users, Calendar, PieChart, Car, Building2, Info } from 'lucide-react';

export const FinancialSubscriptionDashboard = () => {
  const { stats, loading } = useUnifiedSubscriptions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string = 'CDF') => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const monthlyRevenue = stats?.monthlyRevenue || 0;
  const activeSubscriptions = stats?.totalActiveSubscriptions || 0;
  const expiringCount = stats?.expiringInWeek || 0;
  const driverCount = stats?.driverSubscriptions || 0;
  const rentalCount = stats?.rentalSubscriptions || 0;
  const projectedAnnualRevenue = monthlyRevenue * 12;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques Financières</h1>
        <p className="text-muted-foreground mt-2">
          Analyse des revenus générés par les abonnements
        </p>
      </div>

      {/* Cartes principales (données réelles) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Mensuels</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenus d'abonnements ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Chauffeurs et partenaires location
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projection Annuelle</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectedAnnualRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenu mensuel × 12
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirations Proches</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dans les 7 prochains jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition par type (compteurs réels) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Répartition des Abonnements
          </CardTitle>
          <CardDescription>Nombre d'abonnements actifs par type de service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Abonnements Chauffeurs</p>
                  <p className="text-sm text-muted-foreground">Chauffeurs VTC</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{driverCount}</span>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Abonnements Location</p>
                  <p className="text-sm text-muted-foreground">Partenaires location</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{rentalCount}</span>
            </div>
          </div>

          {activeSubscriptions === 0 && (
            <div className="flex items-start gap-3 mt-4 p-4 bg-muted/50 rounded-lg">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Aucun abonnement actif pour le moment. Les statistiques détaillées
                (revenu par type, taux de renouvellement) seront disponibles dès que
                les premiers abonnements payants seront enregistrés.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
