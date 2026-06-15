import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Star, TrendingUp } from 'lucide-react';
import { useAdminFoodAnalytics } from '@/hooks/admin/useAdminFoodAnalytics';

export const FoodAnalytics = () => {
  const { analytics, loading, fetchAnalytics } = useAdminFoodAnalytics();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Chargement des analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenus Food (30j)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatPrice(analytics?.revenue30d || 0)}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{analytics?.revenueGrowth || 0}% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Commandes (30j)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics?.orders30d || 0}</p>
            <p className="text-sm text-muted-foreground">
              Panier moyen : {formatPrice(analytics?.avgOrderValue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Restaurants actifs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics?.activeRestaurants || 0}</p>
            <p className="text-sm text-muted-foreground">
              {analytics?.newRestaurantsThisMonth || 0} nouveaux ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux satisfaction</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics?.satisfactionRate || 0}%</p>
            <p className="text-sm text-muted-foreground">
              Note moyenne : {analytics?.avgRating?.toFixed(1) || 0}/5
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top restaurants */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Restaurants (Revenus 30j)</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.topRestaurants && analytics.topRestaurants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Revenus</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topRestaurants.map((restaurant, index) => (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{restaurant.name}</TableCell>
                    <TableCell>{restaurant.city}</TableCell>
                    <TableCell>{restaurant.orders_count}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatPrice(restaurant.total_revenue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{restaurant.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top produits */}
      <Card>
        <CardHeader>
          <CardTitle>Produits les plus commandés</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.topProducts && analytics.topProducts.length > 0 ? (
            <div className="space-y-3">
              {analytics.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4">
                  <Badge className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.restaurant_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{product.total_orders} commandes</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(product.total_revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
