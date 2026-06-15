import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Package, ShoppingCart, Users, Eye, CheckCircle, XCircle, 
  LayoutDashboard, BarChart3, AlertCircle, DollarSign, TrendingUp,
  Clock, ImageIcon, Filter, Calendar, ZoomIn, Trash2
} from 'lucide-react';
import VehicleGalleryLightbox from '@/components/rental/VehicleGalleryLightbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SellerModerationPanel } from './marketplace/SellerModerationPanel';
import { SellerVerificationPanel } from './marketplace/SellerVerificationPanel';
import { ProductAnalyticsDashboard } from './marketplace/ProductAnalyticsDashboard';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


export function AdminMarketplaceManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch marketplace statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['marketplaceStats'],
    queryFn: async () => {
      const [productsRes, ordersRes, sellersRes] = await Promise.all([
        supabase.from('marketplace_products').select('id, moderation_status', { count: 'exact' }),
        supabase.from('marketplace_orders').select('id, status, total_amount', { count: 'exact' }),
        supabase.from('seller_profiles').select('id', { count: 'exact' })
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];

      return {
        totalProducts: productsRes.count || 0,
        pendingModeration: products.filter(p => p.moderation_status === 'pending').length,
        approvedProducts: products.filter(p => p.moderation_status === 'approved').length,
        rejectedProducts: products.filter(p => p.moderation_status === 'rejected').length,
        inactiveProducts: products.filter(p => p.moderation_status === 'inactive').length,
        totalOrders: ordersRes.count || 0,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalSellers: sellersRes.count || 0,
        totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0)
      };
    },
    refetchInterval: 30000
  });

  // Fetch real products data
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['marketplaceProducts', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_products')
        .select(`
          id, title, price, moderation_status, status, created_at, seller_id, 
          images, category, description,
          vendor_profiles(shop_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      // Filter logic: "all" excludes inactive, "inactive" shows only inactive
      if (statusFilter === 'inactive') {
        query = query.eq('moderation_status', 'inactive');
      } else if (statusFilter === 'all') {
        query = query.neq('moderation_status', 'inactive');
      } else {
        query = query.eq('moderation_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.title,
        price: p.price,
        moderation_status: p.moderation_status,
        status: p.status,
        created_at: p.created_at,
        seller_id: p.seller_id,
        images: p.images || [],
        category: p.category || 'Non catégorisé',
        description: p.description || '',
        profiles: {
          display_name: p.vendor_profiles?.shop_name || 'Vendeur inconnu',
          verified_seller: false
        }
      }));
    }
  });

  // Filtered products (no longer needs client-side filter since query handles it)
  const filteredProducts = products || [];

  // Counts for filter pills (fetch all counts separately)
  const { data: allCounts } = useQuery({
    queryKey: ['marketplaceProductCounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('moderation_status');
      if (error) throw error;
      const items = data || [];
      return {
        all: items.filter(p => p.moderation_status !== 'inactive').length,
        pending: items.filter(p => p.moderation_status === 'pending').length,
        approved: items.filter(p => p.moderation_status === 'approved').length,
        rejected: items.filter(p => p.moderation_status === 'rejected').length,
        inactive: items.filter(p => p.moderation_status === 'inactive').length,
      };
    },
    refetchInterval: 30000
  });

  const filterCounts = allCounts || { all: 0, pending: 0, approved: 0, rejected: 0, inactive: 0 };

  // Fetch real orders data
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['marketplaceOrders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data?.map(o => ({
        id: o.id,
        total_amount: o.total_amount,
        status: o.status,
        created_at: o.created_at,
        profiles: { display_name: 'Acheteur', email: '' },
        products: { name: 'Produit', price: o.total_amount }
      })) || [];
    }
  });

  // Update product moderation status
  const updateProductStatus = useMutation({
    mutationFn: async ({ 
      productId, 
      action, 
      rejectionReason 
    }: { 
      productId: string; 
      action: 'approve' | 'reject';
      rejectionReason?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('moderate-product', {
        body: { productId, action, rejectionReason }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceProducts'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceStats'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceProductCounts'] });
      toast({
        title: "Succès",
        description: "Produit modéré avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la modération",
        variant: "destructive",
      });
      console.error('Product moderation error:', error);
    }
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceProducts'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceStats'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceProductCounts'] });
      setSelectedProduct(null);
      setProductToDelete(null);
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé définitivement",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  });

  const getModerationBadge = (status: string) => {
    const config: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
      pending: { className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', label: 'En attente', icon: <Clock className="h-3 w-3" /> },
      approved: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', label: 'Approuvé', icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', label: 'Rejeté', icon: <XCircle className="h-3 w-3" /> },
      inactive: { className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700', label: 'Inactif', icon: <AlertCircle className="h-3 w-3" /> },
    };
    const c = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${c.className}`}>
        {c.icon} {c.label}
      </span>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'secondary' as const, label: 'En attente' },
      completed: { variant: 'default' as const, label: 'Terminé' },
      cancelled: { variant: 'destructive' as const, label: 'Annulé' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const statCards = [
    {
      title: 'Produits',
      value: stats?.totalProducts || 0,
      icon: Package,
      iconBg: 'bg-blue-100 dark:bg-blue-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      cardBg: 'bg-blue-50/50 dark:bg-blue-950/10',
      subtitle: `${stats?.approvedProducts || 0} approuvés`,
      badge: stats?.pendingModeration ? { label: `${stats.pendingModeration} en attente`, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' } : null,
    },
    {
      title: 'Commandes',
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/10',
      subtitle: 'Total commandes',
      badge: stats?.pendingOrders ? { label: `${stats.pendingOrders} en cours`, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' } : null,
    },
    {
      title: 'Vendeurs',
      value: stats?.totalSellers || 0,
      icon: Users,
      iconBg: 'bg-violet-100 dark:bg-violet-950/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      cardBg: 'bg-violet-50/50 dark:bg-violet-950/10',
      subtitle: 'Vendeurs inscrits',
      badge: null,
    },
    {
      title: "Chiffre d'affaires",
      value: `${(stats?.totalRevenue || 0).toLocaleString()} CDF`,
      icon: DollarSign,
      iconBg: 'bg-amber-100 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      cardBg: 'bg-amber-50/50 dark:bg-amber-950/10',
      subtitle: 'Commandes terminées',
      badge: null,
    },
  ];

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestion Marketplace</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez les produits, commandes et vendeurs de la marketplace
        </p>
      </div>

      {/* Alert banner for pending moderation */}
      {(stats?.pendingModeration || 0) > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-orange-300/60 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/20">
          <div className="flex-shrink-0 p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-orange-900 dark:text-orange-200">Action requise</p>
            <p className="text-xs text-orange-700 dark:text-orange-400">
              {stats?.pendingModeration} produit{(stats?.pendingModeration || 0) > 1 ? 's' : ''} en attente de modération
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/40 flex-shrink-0"
            onClick={() => setActiveTab('products')}
          >
            Modérer
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Responsive tabs with icons and horizontal scroll */}
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start sm:justify-center gap-1 bg-muted/40 p-1.5 rounded-xl">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
            <span className="sm:hidden">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
            <Package className="h-4 w-4" />
            Produits
            {(stats?.pendingModeration || 0) > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                {stats?.pendingModeration}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
            <ShoppingCart className="h-4 w-4" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="sellers" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
            <Users className="h-4 w-4" />
            Vendeurs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`rounded-xl border border-border/50 p-5 ${stat.cardBg} transition-shadow hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <div className={`p-2.5 rounded-full ${stat.iconBg}`}>
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-extrabold tracking-tight mb-1">{stat.value}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">{stat.subtitle}</span>
                    {stat.badge && (
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${stat.badge.color}`}>
                        {stat.badge.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-5 mt-6">
          {/* Search + Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom de produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 rounded-xl"
              />
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {[
                { key: 'all', label: 'Tous', count: filterCounts.all },
                { key: 'pending', label: 'En attente', count: filterCounts.pending },
                { key: 'approved', label: 'Approuvés', count: filterCounts.approved },
                { key: 'rejected', label: 'Rejetés', count: filterCounts.rejected },
                { key: 'inactive', label: 'Inactifs', count: filterCounts.inactive },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    statusFilter === f.key
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'
                  }`}
                >
                  {f.label}
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold ${
                    statusFilter === f.key
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted-foreground/10 text-muted-foreground'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Product list */}
          {productsLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/50">
                  <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-border/60 bg-muted/20">
              <div className="p-3 rounded-full bg-muted/50 mb-3">
                <Package className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="font-medium text-muted-foreground">Aucun produit trouvé</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {statusFilter !== 'all' ? 'Essayez un autre filtre' : 'Aucun produit soumis'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:shadow-md transition-all duration-200"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-16 w-16 rounded-lg object-cover border border-border/30"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted/50 border border-border/30 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                      {getModerationBadge(product.moderation_status || 'pending')}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Par <span className="font-medium">{product.profiles?.display_name}</span> • {product.price?.toLocaleString()} CDF
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                      <span className="inline-flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {product.category}
                      </span>
                      {product.created_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(product.created_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setSelectedProduct(product)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Voir le produit</TooltipContent>
                      </Tooltip>

                      {product.moderation_status === 'pending' && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
                                onClick={() => updateProductStatus.mutate({ productId: product.id, action: 'approve' })}
                                disabled={updateProductStatus.isPending}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Approuver</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                onClick={() => updateProductStatus.mutate({ productId: product.id, action: 'reject', rejectionReason: 'Rejeté par admin' })}
                                disabled={updateProductStatus.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rejeter</TooltipContent>
                          </Tooltip>
                        </>
                      )}

                      {/* Delete button for rejected/inactive products */}
                      {(product.moderation_status === 'rejected' || product.moderation_status === 'inactive') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                              onClick={() => setProductToDelete(product)}
                              disabled={deleteProduct.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Supprimer</TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Commandes Marketplace</CardTitle>
              <CardDescription>
                Suivi des commandes et gestion des litiges
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {orders?.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">Commande #{order.id.slice(0, 8)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {order.profiles?.display_name} • {order.total_amount} CDF
                        </p>
                        <div className="flex items-center space-x-2">
                          {getOrderStatusBadge(order.status || 'pending')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sellers Tab */}
        <TabsContent value="sellers" className="space-y-6 mt-6">
          <SellerVerificationPanel />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <ProductAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) { setSelectedProduct(null); setMainImageIndex(0); setLightboxOpen(false); } }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          {selectedProduct && (
            <>
              {/* Image gallery */}
              {selectedProduct.images?.length > 0 ? (
                <div className="relative">
                  {/* Main image */}
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={selectedProduct.images[mainImageIndex]}
                      alt={`${selectedProduct.name} - ${mainImageIndex + 1}`}
                      className="h-72 w-full object-cover rounded-t-2xl"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-2xl flex items-center justify-center">
                      <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                    {/* Counter badge */}
                    <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {mainImageIndex + 1}/{selectedProduct.images.length} photos
                    </span>
                  </div>

                  {/* Thumbnail strip */}
                  {selectedProduct.images.length > 1 && (
                    <div className="flex gap-1.5 p-2 bg-muted/30 overflow-x-auto">
                      {selectedProduct.images.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setMainImageIndex(idx)}
                          className={`flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === mainImageIndex
                              ? 'border-emerald-500 ring-1 ring-emerald-500/30 scale-105'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Miniature ${idx + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 bg-muted/30 flex items-center justify-center rounded-t-2xl">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}

              <div className="p-5 space-y-4">
                <DialogHeader className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-lg">{selectedProduct.name}</DialogTitle>
                    {getModerationBadge(selectedProduct.moderation_status || 'pending')}
                  </div>
                </DialogHeader>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground text-xs">Prix</p>
                    <p className="font-bold text-lg">{selectedProduct.price?.toLocaleString()} CDF</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground text-xs">Catégorie</p>
                    <p className="font-medium">{selectedProduct.category}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground text-xs">Vendeur</p>
                    <p className="font-medium">{selectedProduct.profiles?.display_name}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground text-xs">Soumis le</p>
                    <p className="font-medium">
                      {selectedProduct.created_at
                        ? format(new Date(selectedProduct.created_at), 'dd MMM yyyy', { locale: fr })
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">Description</p>
                    <p className="text-sm leading-relaxed">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Actions for pending products */}
                {selectedProduct.moderation_status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        updateProductStatus.mutate({ productId: selectedProduct.id, action: 'approve' });
                        setSelectedProduct(null);
                      }}
                      disabled={updateProductStatus.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        updateProductStatus.mutate({ productId: selectedProduct.id, action: 'reject', rejectionReason: 'Rejeté par admin' });
                        setSelectedProduct(null);
                      }}
                      disabled={updateProductStatus.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                )}

                {/* Delete button for rejected/inactive in modal */}
                {(selectedProduct.moderation_status === 'rejected' || selectedProduct.moderation_status === 'inactive') && (
                  <div className="pt-2">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setProductToDelete(selectedProduct)}
                      disabled={deleteProduct.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer ce produit
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => { if (!open) setProductToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer définitivement « {productToDelete?.name} ». Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (productToDelete) {
                  deleteProduct.mutate(productToDelete.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox plein écran */}
      {selectedProduct?.images?.length > 0 && (
        <VehicleGalleryLightbox
          images={selectedProduct.images.map((url: string, i: number) => ({ url, caption: `${selectedProduct.name} - Photo ${i + 1}` }))}
          initialIndex={mainImageIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
