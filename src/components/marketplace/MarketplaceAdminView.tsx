import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Package, AlertTriangle, DollarSign, Shield } from 'lucide-react';
import { AdminUserVerificationManager } from '@/components/admin/AdminUserVerificationManager';
import { ProductModerationPanel } from './ProductModerationPanel';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminDashboardProps {
  onBack: () => void;
}

export const MarketplaceAdminView: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    pending_products: 0
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load statistics from real user tables
      const [clientsResult, driversResult, partnersResult, productsResult, ordersResult, pendingProductsResult] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact' }),
        supabase.from('chauffeurs').select('id', { count: 'exact' }),
        supabase.from('partenaires').select('id', { count: 'exact' }),
        supabase.from('marketplace_products').select('id, price', { count: 'exact' }),
        supabase.from('marketplace_orders').select('*', { count: 'exact' }),
        supabase.from('marketplace_products').select('id', { count: 'exact' }).eq('moderation_status', 'pending')
      ]);

      const totalUsers = (clientsResult.count || 0) + (driversResult.count || 0) + (partnersResult.count || 0);

      setStats({
        totalUsers,
        totalProducts: productsResult.count || 0,
        pendingOrders: ordersResult.data?.filter(order => order.status === 'pending').length || 0,
        totalRevenue: ordersResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        pending_products: pendingProductsResult.count || 0
      });

      // Load recent products
      const { data: recentProducts } = await supabase
        .from('marketplace_products')
        .select('*, profiles!marketplace_products_seller_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      setProducts(recentProducts || []);

      // Load recent orders
      const { data: recentOrders } = await supabase
        .from('marketplace_orders')
        .select('*, marketplace_products(title), profiles!marketplace_orders_buyer_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      setOrders(recentOrders || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du tableau de bord',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductStatusChange = async (productId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: 'Le statut du produit a été modifié'
      });

      loadDashboardData();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Administration</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateurs</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Produits</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenus</p>
                  <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} CDF</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="moderation" className="relative">
              Modération
              {stats.pending_products > 0 && (
                <Badge className="ml-2 h-5 min-w-5 flex items-center justify-center bg-destructive text-destructive-foreground">
                  {stats.pending_products}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="verifications">
              <Shield className="w-4 h-4 mr-1" />
              Vérifications
            </TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produits récents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{product.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Par {product.profiles?.display_name || 'Vendeur inconnu'}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {product.price?.toLocaleString()} CDF
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          product.moderation_status === 'approved' ? 'default' : 
                          product.moderation_status === 'rejected' ? 'destructive' : 
                          'secondary'
                        }>
                          {product.moderation_status === 'approved' ? 'Approuvé' :
                           product.moderation_status === 'rejected' ? 'Rejeté' :
                           'En attente'}
                        </Badge>
                        {product.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProductStatusChange(product.id, 'inactive')}
                          >
                            Désactiver
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <ProductModerationPanel />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commandes récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{order.marketplace_products?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Par {order.profiles?.display_name || 'Acheteur inconnu'}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {order.total_amount?.toLocaleString()} CDF
                        </p>
                      </div>
                      <Badge variant={
                        order.status === 'pending' ? 'secondary' :
                        order.status === 'confirmed' ? 'default' :
                        order.status === 'completed' ? 'default' : 'destructive'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verifications" className="space-y-4">
            <AdminUserVerificationManager />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Fonctionnalités de gestion des utilisateurs à venir...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};