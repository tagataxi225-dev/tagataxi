import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CommissionDeprecationBanner } from "../subscriptions/CommissionDeprecationBanner";
import { AdminWalletOverview } from "../AdminWalletOverview";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
  return { start, end };
};

const formatCDF = (amount: number) =>
  new Intl.NumberFormat("fr-CD").format(Math.round(amount)) + " CDF";

export const AdminFinancialDashboard = () => {
  const { start, end } = getMonthRange();

  const { data: transportRevenue, isLoading: loadingTransport } = useQuery({
    queryKey: ["revenue", "transport", start],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transport_bookings")
        .select("estimated_price")
        .eq("status", "completed")
        .gte("created_at", start)
        .lte("created_at", end);
      if (error) throw error;
      return data.reduce((sum, r) => sum + (r.estimated_price ?? 0), 0);
    },
  });

  const { data: deliveryRevenue, isLoading: loadingDelivery } = useQuery({
    queryKey: ["revenue", "delivery", start],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_orders")
        .select("estimated_price")
        .eq("status", "delivered")
        .gte("created_at", start)
        .lte("created_at", end);
      if (error) throw error;
      return data.reduce((sum, r) => sum + (r.estimated_price ?? 0), 0);
    },
  });

  const { data: marketplaceRevenue, isLoading: loadingMarketplace } = useQuery({
    queryKey: ["revenue", "marketplace", start],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_orders")
        .select("total_amount")
        .eq("status", "delivered")
        .gte("created_at", start)
        .lte("created_at", end);
      if (error) throw error;
      return data.reduce((sum, r) => sum + (r.total_amount ?? 0), 0);
    },
  });

  const isLoading = loadingTransport || loadingDelivery || loadingMarketplace;
  const totalRevenue = (transportRevenue ?? 0) + (deliveryRevenue ?? 0) + (marketplaceRevenue ?? 0);
  const annualProjection = totalRevenue * 12;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tableau de Bord Financier</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble des finances et revenus de la plateforme
        </p>
      </div>

      {/* Banner de dépréciation des commissions */}
      <CommissionDeprecationBanner />

      {/* KPIs Financiers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus du Mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <div className="text-2xl font-bold">{formatCDF(totalRevenue)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Transport + Livraison + Marketplace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Transport</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingTransport ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <div className="text-2xl font-bold">{formatCDF(transportRevenue ?? 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Courses complétées ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Livraison</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingDelivery ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <div className="text-2xl font-bold">{formatCDF(deliveryRevenue ?? 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Livraisons effectuées ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projections Annuelles</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <div className="text-2xl font-bold">{formatCDF(annualProjection)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Basé sur MRR actuel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets détaillés */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="commissions">Commissions (Déprécié)</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Graphiques de Revenus</CardTitle>
              <CardDescription>
                Évolution des revenus par source sur les 6 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Graphiques en cours d'implémentation...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenus par Abonnements</CardTitle>
              <CardDescription>
                Détail des revenus générés par les abonnements chauffeurs et location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Statistiques détaillées en cours d'implémentation...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenus par Commissions (Système déprécié)</CardTitle>
              <CardDescription>
                Historique et transition vers le système d'abonnements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ce système sera complètement désactivé le 31 décembre 2025.
                Tous les chauffeurs doivent migrer vers le système d'abonnements.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Transactions</CardTitle>
              <CardDescription>
                Liste complète des transactions de paiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Historique des transactions en cours d'implémentation...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Wallets utilisateurs */}
      <AdminWalletOverview />
    </div>
  );
};
