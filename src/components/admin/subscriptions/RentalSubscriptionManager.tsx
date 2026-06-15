import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RentalSubscriptionPlans } from './RentalSubscriptionPlans';
import { ActiveRentalSubscriptions } from './ActiveRentalSubscriptions';
import { RentalSubscriptionAnalytics } from './RentalSubscriptionAnalytics';
import { usePartnerRentalSubscriptions } from '@/hooks/usePartnerRentalSubscriptions';
import { Plus, CreditCard, BarChart3, Settings } from 'lucide-react';

export const RentalSubscriptionManager = () => {
  const [activeTab, setActiveTab] = useState('subscriptions');
  const { stats, isLoading } = usePartnerRentalSubscriptions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Abonnements Location</h2>
          <p className="text-muted-foreground">
            Gestion complète des abonnements partenaires et plans
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {isLoading ? "Chargement..." : `${stats?.activeSubscriptions || 0} actifs`}
        </Badge>
      </div>

      {/* Statistics Cards */}
      {!isLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abonnements Actifs</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                Sur {stats.totalSubscriptions} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Mensuels</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.monthlyRevenue.toLocaleString()} CDF
              </div>
              <p className="text-xs text-muted-foreground">
                Abonnements actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expirent Bientôt</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.expiringInWeek}
              </div>
              <p className="text-xs text-muted-foreground">
                Dans les 7 prochains jours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Renouvellement</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">85%</div>
              <p className="text-xs text-muted-foreground">
                Moyenne mensuelle
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Abonnements Actifs
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Plans d'Abonnement
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-6">
          <ActiveRentalSubscriptions />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <RentalSubscriptionPlans />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <RentalSubscriptionAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};