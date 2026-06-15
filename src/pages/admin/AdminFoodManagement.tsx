import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminFoodStats } from "@/hooks/admin/useAdminFoodStats";
import { RestaurantManagement } from "@/components/admin/food/RestaurantManagement";
import { FoodProductModeration } from "@/components/admin/food/FoodProductModeration";
import { RestaurantSubscriptionAdmin } from "@/components/admin/food/RestaurantSubscriptionAdmin";
import { RestaurantCommissionConfig } from "@/components/admin/restaurants/RestaurantCommissionConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Store, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  DollarSign,
  Timer,
  ChefHat
} from "lucide-react";

const AdminFoodManagement = () => {
  const { stats, loading, refetch } = useAdminFoodStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion Food & Restaurants</h1>
          <p className="text-muted-foreground mt-1">
            Administration complète des restaurants et produits
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          <TabsTrigger value="moderation">Modération Produits</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* RESTAURANTS STATS */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Statistiques Restaurants
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
                      <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalRestaurants || 0}</div>
                      <p className="text-xs text-muted-foreground">Tous statuts confondus</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Actifs</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats?.activeRestaurants || 0}</div>
                      <p className="text-xs text-muted-foreground">Restaurants opérationnels</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                      <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{stats?.pendingRestaurants || 0}</div>
                      <p className="text-xs text-muted-foreground">À valider</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Suspendus</CardTitle>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{stats?.suspendedRestaurants || 0}</div>
                      <p className="text-xs text-muted-foreground">Inactifs</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* PRODUCTS STATS */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Statistiques Produits
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                      <p className="text-xs text-muted-foreground">Tous statuts</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">En Modération</CardTitle>
                      <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{stats?.pendingProducts || 0}</div>
                      <p className="text-xs text-muted-foreground">À modérer</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats?.approvedProducts || 0}</div>
                      <p className="text-xs text-muted-foreground">En vente</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Taux d'Approbation</CardTitle>
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{stats?.approvalRate || 0}%</div>
                      <p className="text-xs text-muted-foreground">Produits validés</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* PERFORMANCE STATS */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance (30 derniers jours)
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.revenue30Days?.toLocaleString() || 0} CDF</div>
                      <p className="text-xs text-muted-foreground">30 derniers jours</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                      <p className="text-xs text-muted-foreground">Commandes complétées</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
                      <Timer className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.avgPreparationTime || 0} min</div>
                      <p className="text-xs text-muted-foreground">Préparation moyenne</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* TOP CATEGORIES */}
              {stats?.topCategories && stats.topCategories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5" />
                      Top 5 Catégories
                    </CardTitle>
                    <CardDescription>Catégories les plus populaires</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topCategories.map((cat, index) => (
                        <div key={cat.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {index + 1}
                            </span>
                            <span className="font-medium">{cat.category}</span>
                          </div>
                          <span className="text-muted-foreground">{cat.count} produits</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* RESTAURANTS TAB */}
        <TabsContent value="restaurants">
          <RestaurantManagement />
        </TabsContent>

        {/* MODERATION TAB */}
        <TabsContent value="moderation">
          <FoodProductModeration />
        </TabsContent>

        {/* SUBSCRIPTIONS TAB */}
        <TabsContent value="subscriptions" className="space-y-4">
          <RestaurantSubscriptionAdmin />
        </TabsContent>

        {/* COMMISSIONS TAB */}
        <TabsContent value="commissions">
          <RestaurantCommissionConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFoodManagement;
