import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react';

export const ProductAnalyticsDashboard = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['marketplace-analytics'],
    queryFn: async () => {
      const [productsRes, ordersRes] = await Promise.all([
        supabase.from('marketplace_products').select('*') as any,
        supabase.from('marketplace_orders').select('*') as any
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];

      // Statistiques par catégorie
      const categoryStats = products.reduce((acc: any, product: any) => {
        const category = product.category || 'Autres';
        if (!acc[category]) {
          acc[category] = { count: 0, sales: 0 };
        }
        acc[category].count++;
        return acc;
      }, {});

      // Top ventes
      const completedOrders = orders.filter((o: any) => o.status === 'completed');
      const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

      // Ventes par vendeur
      const sellerSales = completedOrders.reduce((acc: any, order: any) => {
        const items = order.items || [];
        items.forEach((item: any) => {
          const sellerId = products.find((p: any) => p.id === item.product_id)?.seller_id || 'unknown';
          if (!acc[sellerId]) {
            acc[sellerId] = { orders: 0, revenue: 0 };
          }
          acc[sellerId].orders++;
          acc[sellerId].revenue += item.price * item.quantity;
        });
        return acc;
      }, {});

      return {
        totalProducts: products.length,
        activeProducts: products.filter((p: any) => p.status === 'approved').length,
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        totalRevenue,
        categoryStats,
        topSellers: Object.entries(sellerSales)
          .map(([id, data]: any) => ({ sellerId: id, ...data }))
          .sort((a: any, b: any) => b.revenue - a.revenue)
          .slice(0, 5),
        averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
      };
    },
    refetchInterval: 60000
  });

  const statCards = [
    {
      title: "Produits actifs",
      value: analytics?.activeProducts || 0,
      description: `Sur ${analytics?.totalProducts || 0} total`,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Commandes totales",
      value: analytics?.totalOrders || 0,
      description: `${analytics?.completedOrders || 0} terminées`,
      icon: ShoppingCart,
      color: "text-green-600"
    },
    {
      title: "Chiffre d'affaires",
      value: `${(analytics?.totalRevenue || 0).toLocaleString()} CDF`,
      description: `Moy: ${Math.round(analytics?.averageOrderValue || 0).toLocaleString()} CDF`,
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Catégories",
      value: Object.keys(analytics?.categoryStats || {}).length,
      description: "Catégories actives",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top vendeurs */}
          <Card>
            <CardHeader>
              <CardTitle>Top Vendeurs</CardTitle>
              <CardDescription>Classement par chiffre d'affaires</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.topSellers && analytics.topSellers.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topSellers.map((seller: any, index: number) => (
                    <div key={seller.sellerId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">Vendeur {seller.sellerId.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{seller.orders} commandes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {Math.round(seller.revenue).toLocaleString()} CDF
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune vente enregistrée
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques par catégorie */}
          <Card>
            <CardHeader>
              <CardTitle>Produits par catégorie</CardTitle>
              <CardDescription>Distribution des produits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics?.categoryStats || {}).map(([category, data]: any) => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{category}</p>
                      <p className="text-sm text-muted-foreground">Catégorie marketplace</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{data.count} produits</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};