import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionsOverview } from "./SubscriptionsOverview";
import { DriverSubscriptionAdmin } from "./DriverSubscriptionAdmin";
import { RentalSubscriptionAdmin } from "./RentalSubscriptionAdmin";
import { SubscriptionAnalytics } from "./SubscriptionAnalytics";
import { SubscriptionPlansConfig } from "./SubscriptionPlansConfig";
import { useUnifiedSubscriptions } from "@/hooks/useUnifiedSubscriptions";
import { Loader2, Users, Car, AlertTriangle, TrendingUp } from "lucide-react";

export const UnifiedSubscriptionManager = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, loading } = useUnifiedSubscriptions();

  // Ne pas bloquer l'interface si les stats chargent
  const hasLoadingStats = loading && !stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Gestion des Abonnements</h1>
            {hasLoadingStats && (
              <Badge variant="outline">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Chargement des statistiques...
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Interface unifiée pour gérer tous les types d'abonnements
          </p>
        </div>
        
        {stats ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenus mensuels</p>
                  <p className="text-lg font-semibold">
                    {stats.monthlyRevenue.toLocaleString()} {stats.currency}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Abonnements actifs</p>
                  <p className="text-lg font-semibold">{stats.totalActiveSubscriptions}</p>
                </div>
              </div>
            </Card>
            
            {stats.expiringInWeek > 0 && (
              <Card className="p-4 border-orange-200 bg-orange-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-orange-700">Expirent cette semaine</p>
                    <p className="text-lg font-semibold text-orange-700">{stats.expiringInWeek}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : !hasLoadingStats ? (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">
              Les statistiques ne sont pas disponibles pour le moment.
            </p>
          </Card>
        ) : null}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
            <span className="sm:hidden">Vue</span>
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Chauffeurs</span>
            <span className="sm:hidden">Drivers</span>
            {stats && stats.driverSubscriptions > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.driverSubscriptions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rentals" className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2">
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">Location</span>
            <span className="sm:hidden">Loc.</span>
            {stats && stats.rentalSubscriptions > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.rentalSubscriptions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2">
            <span>📊</span>
            <span className="hidden lg:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:inline">Plans & Config</span>
            <span className="sm:hidden">⚙️</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SubscriptionsOverview />
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6">
          <DriverSubscriptionAdmin />
        </TabsContent>

        <TabsContent value="rentals" className="space-y-6">
          <RentalSubscriptionAdmin />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SubscriptionAnalytics />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SubscriptionPlansConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};