import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, ShoppingBag, DollarSign, AlertTriangle } from 'lucide-react';
import { RestaurantManagement } from './RestaurantManagement';
import { FoodProductModeration } from './FoodProductModeration';
import { FoodOrdersMonitor } from './FoodOrdersMonitor';
import { FoodAnalytics } from './FoodAnalytics';
import { useAdminFoodAnalytics } from '@/hooks/admin/useAdminFoodAnalytics';
import { useAdminFoodProducts } from '@/hooks/admin/useAdminFoodProducts';

export const AdminFoodDashboard = () => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const { analytics, fetchAnalytics } = useAdminFoodAnalytics();
  const { products, fetchPendingProducts } = useAdminFoodProducts();

  useEffect(() => {
    fetchAnalytics();
    fetchPendingProducts();
  }, []);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Restaurants actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics?.activeRestaurants || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              +{analytics?.newRestaurantsThisMonth || 0} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Commandes (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics?.orders30d || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Panier moyen: {formatPrice(analytics?.avgOrderValue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenus (30j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatPrice(analytics?.revenue30d || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              +{analytics?.revenueGrowth || 0}% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              En modération
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{products.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Produits en attente</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants" className="mt-6">
          <RestaurantManagement />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <FoodProductModeration />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <FoodOrdersMonitor />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <FoodAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};
