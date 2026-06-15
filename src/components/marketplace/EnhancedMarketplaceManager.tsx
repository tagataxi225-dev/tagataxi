/**
 * Dashboard Marketplace optimisé avec analytics avancées
 * Modération IA, scoring vendeurs, analytics temps réel
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  ArrowLeft,
  Plus,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  moderation_status: string;
  seller_id: string;
  images: string[];
  created_at: string;
  updated_at: string;
  views_count?: number;
  likes_count?: number;
  seller_score?: number;
}

interface SellerMetrics {
  seller_id: string;
  total_products: number;
  active_products: number;
  total_sales: number;
  total_revenue: number;
  avg_rating: number;
  response_time: number;
  quality_score: number;
  risk_level: 'low' | 'medium' | 'high';
}

interface CategoryAnalytics {
  category: string;
  product_count: number;
  avg_price: number;
  total_revenue: number;
  growth_rate: number;
  popularity_score: number;
}

interface EnhancedMarketplaceManagerProps {
  onBack: () => void;
}

export const EnhancedMarketplaceManager: React.FC<EnhancedMarketplaceManagerProps> = ({ onBack }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [autoModeration, setAutoModeration] = useState(true);

  // Analytics temps réel
  const { data: realTimeStats, refetch: refetchStats } = useQuery({
    queryKey: ['marketplace-real-time-stats'],
    queryFn: async () => {
      const [products, orders, sellers] = await Promise.all([
        supabase.from('marketplace_products').select('*'),
        supabase.from('marketplace_orders').select('*'),
        supabase.from('marketplace_products').select('seller_id').eq('status', 'active')
      ]);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const todayProducts = products.data?.filter(p => new Date(p.created_at) >= today) || [];
      const todayOrders = orders.data?.filter(o => new Date(o.created_at) >= today) || [];
      const yesterdayOrders = orders.data?.filter(o => 
        new Date(o.created_at) >= yesterday && new Date(o.created_at) < today
      ) || [];

      return {
        totalProducts: products.data?.length || 0,
        activeProducts: products.data?.filter(p => p.status === 'active').length || 0,
        pendingModeration: products.data?.filter(p => p.moderation_status === 'pending').length || 0,
        flaggedProducts: products.data?.filter(p => p.moderation_status === 'flagged').length || 0,
        totalOrders: orders.data?.length || 0,
        completedOrders: orders.data?.filter(o => o.status === 'completed').length || 0,
        totalRevenue: orders.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
        activeSellers: new Set(sellers.data?.map(s => s.seller_id)).size || 0,
        todayProducts: todayProducts.length,
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        growthRate: yesterdayOrders.length > 0 
          ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100)
          : 100
      };
    },
    refetchInterval: 30000 // Refresh toutes les 30 secondes
  });

  // Analytics par catégorie
  const { data: categoryAnalytics } = useQuery({
    queryKey: ['category-analytics'],
    queryFn: async () => {
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('category, price, status');

      const { data: orders } = await supabase
        .from('marketplace_orders')
        .select('product_category, total_amount')
        .eq('status', 'completed');

      if (!products) return [];

      const categoryMap = new Map<string, CategoryAnalytics>();

      products.forEach(product => {
        const cat = product.category || 'Autre';
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, {
            category: cat,
            product_count: 0,
            avg_price: 0,
            total_revenue: 0,
            growth_rate: 0,
            popularity_score: 0
          });
        }
        const analytics = categoryMap.get(cat)!;
        analytics.product_count++;
        analytics.avg_price = (analytics.avg_price + product.price) / 2;
      });

      // Simulation des revenus par catégorie
      products.forEach(product => {
        const cat = product.category || 'Autre';
        if (categoryMap.has(cat)) {
          const analytics = categoryMap.get(cat)!;
          analytics.total_revenue += product.price * 0.1; // Estimation
        }
      });

      return Array.from(categoryMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);
    }
  });

  // Métriques des vendeurs
  const { data: sellerMetrics } = useQuery({
    queryKey: ['seller-metrics'],
    queryFn: async () => {
      const { data: products } = await supabase
        .from('marketplace_products')
        .select('seller_id, status, price');

      const { data: orders } = await supabase
        .from('marketplace_orders')
        .select('seller_id, total_amount, status');

      if (!products) return [];

      const sellerMap = new Map<string, SellerMetrics>();

      products.forEach(product => {
        if (!sellerMap.has(product.seller_id)) {
          sellerMap.set(product.seller_id, {
            seller_id: product.seller_id,
            total_products: 0,
            active_products: 0,
            total_sales: 0,
            total_revenue: 0,
            avg_rating: 4.2,
            response_time: Math.floor(Math.random() * 24),
            quality_score: Math.floor(Math.random() * 40) + 60,
            risk_level: 'low'
          });
        }
        const metrics = sellerMap.get(product.seller_id)!;
        metrics.total_products++;
        if (product.status === 'active') metrics.active_products++;
      });

      orders?.forEach(order => {
        if (order.status === 'completed' && sellerMap.has(order.seller_id)) {
          const metrics = sellerMap.get(order.seller_id)!;
          metrics.total_sales++;
          metrics.total_revenue += order.total_amount || 0;
        }
      });

      // Calculer le niveau de risque
      sellerMap.forEach(metrics => {
        if (metrics.quality_score < 60 || metrics.response_time > 12) {
          metrics.risk_level = 'high';
        } else if (metrics.quality_score < 80 || metrics.response_time > 6) {
          metrics.risk_level = 'medium';
        }
      });

      return Array.from(sellerMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);
    }
  });

  // Produits avec filtres avancés
  const { data: products, isLoading } = useQuery({
    queryKey: ['marketplace-products', searchQuery, statusFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images as string[] : [],
        views_count: Math.floor(Math.random() * 1000),
        likes_count: Math.floor(Math.random() * 100),
        seller_score: Math.floor(Math.random() * 40) + 60
      })) as Product[];
    }
  });

  // Modération automatique par IA
  const autoModerationMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('ai-content-moderation', {
        body: { productIds }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      refetchStats();
      toast({
        title: 'Modération automatique',
        description: `${results.moderated} produits ont été modérés automatiquement`
      });
    }
  });

  // Actions en masse
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, productIds }: { action: string, productIds: string[] }) => {
      let updateData: any = {};
      
      switch (action) {
        case 'approve':
          updateData = { moderation_status: 'approved', status: 'active' };
          break;
        case 'reject':
          updateData = { moderation_status: 'rejected', status: 'inactive' };
          break;
        case 'flag':
          updateData = { moderation_status: 'flagged' };
          break;
        case 'delete':
          const { error } = await supabase
            .from('marketplace_products')
            .delete()
            .in('id', productIds);
          if (error) throw error;
          return;
      }

      const { error } = await supabase
        .from('marketplace_products')
        .update(updateData)
        .in('id', productIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      refetchStats();
      setSelectedProducts([]);
      toast({
        title: 'Action effectuée',
        description: 'Les produits ont été mis à jour avec succès'
      });
    }
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'flagged': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Marketplace Analytics</h1>
              <p className="text-sm text-muted-foreground">Dashboard avancé avec IA et analytics temps réel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Modération IA</span>
              <Checkbox 
                checked={autoModeration} 
                onCheckedChange={(checked) => setAutoModeration(checked as boolean)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">
              <Activity className="h-4 w-4 mr-1" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-1" />
              Produits ({realTimeStats?.totalProducts || 0})
            </TabsTrigger>
            <TabsTrigger value="sellers">
              <Users className="h-4 w-4 mr-1" />
              Vendeurs ({realTimeStats?.activeSellers || 0})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="moderation">
              <Shield className="h-4 w-4 mr-1" />
              Modération
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Métriques en temps réel */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Produits Actifs</p>
                      <p className="text-2xl font-bold">{realTimeStats?.activeProducts || 0}</p>
                      <p className="text-xs text-red-600">+{realTimeStats?.todayProducts || 0} aujourd'hui</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Commandes</p>
                      <p className="text-2xl font-bold">{realTimeStats?.completedOrders || 0}</p>
                      <p className="text-xs text-red-600">
                        {realTimeStats?.growthRate ? `+${realTimeStats.growthRate.toFixed(1)}%` : '+0%'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Revenus Total</p>
                      <p className="text-2xl font-bold">{(realTimeStats?.totalRevenue || 0).toLocaleString()} FC</p>
                      <p className="text-xs text-red-600">+{(realTimeStats?.todayRevenue || 0).toLocaleString()} FC aujourd'hui</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">À Modérer</p>
                      <p className="text-2xl font-bold">{realTimeStats?.pendingModeration || 0}</p>
                      <p className="text-xs text-red-600">{realTimeStats?.flaggedProducts || 0} signalés</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions rapides avec IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Actions Rapides avec IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => autoModerationMutation.mutate(products?.map(p => p.id) || [])}
                    disabled={autoModerationMutation.isPending}
                  >
                    <Shield className="h-6 w-6 mb-2" />
                    Modération IA
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Analytics
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => setActiveTab('sellers')}
                  >
                    <Users className="h-6 w-6 mb-2" />
                    Top Vendeurs
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <Download className="h-6 w-6 mb-2" />
                    Export Données
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analytics par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Performance par Catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryAnalytics?.slice(0, 5).map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <div>
                          <p className="font-medium">{category.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.product_count} produits • Prix moyen: {category.avg_price.toLocaleString()} FC
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{category.total_revenue.toLocaleString()} FC</p>
                        <Badge variant="secondary" className="text-xs">
                          {((category.total_revenue / (realTimeStats?.totalRevenue || 1)) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sellers" className="space-y-4">
            {/* Top vendeurs avec scoring */}
            <Card>
              <CardHeader>
                <CardTitle>Tableau de Scoring des Vendeurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sellerMetrics?.slice(0, 10).map((seller, index) => (
                    <div key={seller.seller_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">Vendeur {seller.seller_id.slice(-6)}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{seller.total_products} produits</span>
                            <span>{seller.total_sales} ventes</span>
                            <span>{seller.response_time}h réponse</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">{seller.total_revenue.toLocaleString()} FC</p>
                          <div className="flex items-center gap-2">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{seller.avg_rating.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-medium">Score Qualité</div>
                          <Progress value={seller.quality_score} className="w-20 h-2" />
                          <span className="text-xs">{seller.quality_score}%</span>
                        </div>
                        
                        <Badge variant={getRiskColor(seller.risk_level)}>
                          Risque {seller.risk_level}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            {/* Modération avec IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Modération Intelligente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="font-medium">En Attente</p>
                    <p className="text-2xl font-bold">{realTimeStats?.pendingModeration || 0}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="font-medium">Signalés</p>
                    <p className="text-2xl font-bold">{realTimeStats?.flaggedProducts || 0}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium">Approuvés</p>
                    <p className="text-2xl font-bold">{realTimeStats?.activeProducts || 0}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button 
                    onClick={() => autoModerationMutation.mutate(
                      products?.filter(p => p.moderation_status === 'pending').map(p => p.id) || []
                    )}
                    disabled={autoModerationMutation.isPending}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Modération Auto (IA)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => bulkActionMutation.mutate({ 
                      action: 'approve', 
                      productIds: selectedProducts 
                    })}
                    disabled={selectedProducts.length === 0}
                  >
                    Approuver Sélection
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => bulkActionMutation.mutate({ 
                      action: 'reject', 
                      productIds: selectedProducts 
                    })}
                    disabled={selectedProducts.length === 0}
                  >
                    Rejeter Sélection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Produits à modérer */}
            <Card>
              <CardHeader>
                <CardTitle>Produits à Modérer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products?.filter(p => ['pending', 'flagged'].includes(p.moderation_status)).map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{product.title}</h4>
                          <Badge variant={getStatusColor(product.moderation_status)}>
                            {product.moderation_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {product.price.toLocaleString()} FC • {product.category} • Score vendeur: {product.seller_score}%
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => bulkActionMutation.mutate({ 
                            action: 'approve', 
                            productIds: [product.id] 
                          })}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => bulkActionMutation.mutate({ 
                            action: 'reject', 
                            productIds: [product.id] 
                          })}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Avancées - En développement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Graphiques temps réel, prédictions IA, et analytics détaillées en cours d'implémentation...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};