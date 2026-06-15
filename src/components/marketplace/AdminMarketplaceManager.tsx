import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  MoreHorizontal,
  Package,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminCreateProductForm } from './AdminCreateProductForm';
import { AdminProductDetails } from './AdminProductDetails';
import { AdminModerationQueue } from './AdminModerationQueue';

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
  seller?: {
    display_name: string;
  };
}

interface AdminMarketplaceManagerProps {
  onBack: () => void;
}

export const AdminMarketplaceManager: React.FC<AdminMarketplaceManagerProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moderationFilter, setModerationFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showModerationQueue, setShowModerationQueue] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    pendingModeration: 0,
    totalRevenue: 0,
    topCategory: '',
    topSeller: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    setProducts(data.map(product => ({
      ...product,
      images: Array.isArray(product.images) ? product.images as string[] : [],
      seller: { display_name: 'Vendeur' }
    })));
  };

  const loadStatistics = async () => {
    // Load product statistics
    const { data: productStats } = await supabase
      .from('marketplace_products')
      .select('status, moderation_status, category, price');

    // Load order statistics for revenue
    const { data: orderStats } = await supabase
      .from('marketplace_orders')
      .select('total_amount')
      .eq('status', 'completed');

    if (productStats) {
      const totalProducts = productStats.length;
      const activeProducts = productStats.filter(p => p.status === 'active').length;
      const pendingModeration = productStats.filter(p => p.moderation_status === 'pending').length;
      const totalRevenue = orderStats?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      // Calculate top category
      const categoryCount = productStats.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topCategory = Object.entries(categoryCount).sort(([,a], [,b]) => b - a)[0]?.[0] || '';

      setStats({
        totalProducts,
        activeProducts,
        pendingModeration,
        totalRevenue,
        topCategory,
        topSeller: ''
      });
    }
  };

  const filteredProducts = products.filter(product => {
    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && product.status !== statusFilter) {
      return false;
    }
    if (moderationFilter !== 'all' && product.moderation_status !== moderationFilter) {
      return false;
    }
    return true;
  });

  const handleProductStatusChange = async (productId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: 'Le statut du produit a été modifié avec succès'
      });

      loadData();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
    }
  };

  const handleProductModerationChange = async (productId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_products')
        .update({ moderation_status: newStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Modération mise à jour',
        description: 'Le statut de modération a été modifié avec succès'
      });

      loadData();
    } catch (error) {
      console.error('Error updating moderation status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la modération',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    try {
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé avec succès'
      });

      loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit',
        variant: 'destructive'
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      toast({
        title: 'Aucune sélection',
        description: 'Veuillez sélectionner au moins un produit',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (action === 'approve') {
        await supabase
          .from('marketplace_products')
          .update({ moderation_status: 'approved', status: 'active' })
          .in('id', selectedProducts);
      } else if (action === 'reject') {
        await supabase
          .from('marketplace_products')
          .update({ moderation_status: 'rejected', status: 'inactive' })
          .in('id', selectedProducts);
      } else if (action === 'delete') {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedProducts.length} produits ?`)) return;
        await supabase
          .from('marketplace_products')
          .delete()
          .in('id', selectedProducts);
      }

      toast({
        title: 'Action effectuée',
        description: `${selectedProducts.length} produits ont été traités`
      });

      setSelectedProducts([]);
      loadData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'effectuer l\'action en masse',
        variant: 'destructive'
      });
    }
  };

  if (showCreateForm) {
    return (
      <AdminCreateProductForm
        onBack={() => setShowCreateForm(false)}
        onSuccess={() => {
          setShowCreateForm(false);
          loadData();
        }}
      />
    );
  }

  if (showProductDetails && selectedProduct) {
    return (
      <AdminProductDetails
        product={selectedProduct}
        onBack={() => {
          setShowProductDetails(false);
          setSelectedProduct(null);
        }}
        onUpdate={() => {
          setShowProductDetails(false);
          setSelectedProduct(null);
          loadData();
        }}
      />
    );
  }

  if (showModerationQueue) {
    return (
      <AdminModerationQueue
        onBack={() => setShowModerationQueue(false)}
        onUpdate={() => loadData()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              ←
            </Button>
            <div>
              <h1 className="text-xl font-bold">Gestion Marketplace</h1>
              <p className="text-sm text-muted-foreground">Administration complète des produits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowModerationQueue(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Modération ({stats.pendingModeration})
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nouveau produit
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="analytics">Analytiques</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Produits</p>
                      <p className="text-2xl font-bold">{stats.totalProducts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Actifs</p>
                      <p className="text-2xl font-bold">{stats.activeProducts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">En modération</p>
                      <p className="text-2xl font-bold">{stats.pendingModeration}</p>
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="h-6 w-6 mb-2" />
                    Créer produit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => setShowModerationQueue(true)}
                  >
                    <AlertTriangle className="h-6 w-6 mb-2" />
                    Modération
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <TrendingUp className="h-6 w-6 mb-2" />
                    Analytiques
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                  >
                    <Download className="h-6 w-6 mb-2" />
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher des produits..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="sold">Vendu</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={moderationFilter} onValueChange={setModerationFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Modération" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {selectedProducts.length} produit(s) sélectionné(s)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleBulkAction('reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleBulkAction('delete')}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products List */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des produits ({filteredProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => (
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
                        
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-medium">{product.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Par {product.seller?.display_name} • {product.category}
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            {product.price.toLocaleString()} CDF
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={
                            product.status === 'active' ? 'default' :
                            product.status === 'sold' ? 'secondary' : 'outline'
                          }>
                            {product.status}
                          </Badge>
                          <Badge variant={
                            product.moderation_status === 'approved' ? 'default' :
                            product.moderation_status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {product.moderation_status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowProductDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytiques Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tableaux de bord et métriques détaillées à venir...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configuration et paramètres globaux à venir...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};