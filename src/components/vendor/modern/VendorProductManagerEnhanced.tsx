import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Package, 
  Eye,
  ShoppingCart,
  TrendingUp,
  Plus,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductGridSkeleton } from '@/components/ui/skeleton-cards';

interface VendorProductManagerEnhancedProps {
  products: any[];
  isLoading?: boolean;
  onCreateProduct: () => void;
  onEditProduct: (productId: string) => void;
  onDeleteProduct: (productId: string) => void;
}

export const VendorProductManagerEnhanced = ({
  products = [],
  isLoading = false,
  onCreateProduct,
  onEditProduct,
  onDeleteProduct
}: VendorProductManagerEnhancedProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'views' | 'sales'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');

  // Statistiques rapides
  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.moderation_status === 'approved' && p.status === 'active').length,
    pending: products.filter(p => p.moderation_status === 'pending').length,
    totalViews: products.reduce((sum, p) => sum + (p.view_count || 0), 0),
    totalSales: products.reduce((sum, p) => sum + (p.sales_count || 0), 0)
  }), [products]);

  // Filtrage et tri intelligents
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = 
          p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
          filterStatus === 'all' ||
          (filterStatus === 'active' && p.moderation_status === 'approved' && p.status === 'active') ||
          (filterStatus === 'pending' && p.moderation_status === 'pending') ||
          (filterStatus === 'rejected' && p.moderation_status === 'rejected');
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch(sortBy) {
          case 'date': 
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'price': 
            return (b.price || 0) - (a.price || 0);
          case 'views': 
            return (b.view_count || 0) - (a.view_count || 0);
          case 'sales':
            return (b.sales_count || 0) - (a.sales_count || 0);
          default: 
            return 0;
        }
      });
  }, [products, searchTerm, sortBy, filterStatus]);

  if (isLoading) {
    return <ProductGridSkeleton count={8} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Produits</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <SlidersHorizontal className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vues</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventes</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalSales}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contrôles de filtrage */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Recherche */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit par nom, description, catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtres */}
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous ({stats.total})</SelectItem>
                  <SelectItem value="active">✅ Actifs ({stats.active})</SelectItem>
                  <SelectItem value="pending">⏳ En attente ({stats.pending})</SelectItem>
                  <SelectItem value="rejected">❌ Rejetés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">📅 Plus récents</SelectItem>
                  <SelectItem value="price">💰 Prix décroissant</SelectItem>
                  <SelectItem value="views">👁️ Plus vus</SelectItem>
                  <SelectItem value="sales">📊 Plus vendus</SelectItem>
                </SelectContent>
              </Select>

              <ToggleGroup type="single" value={viewMode} onValueChange={(v: any) => v && setViewMode(v)}>
                <ToggleGroupItem value="grid" aria-label="Vue grille">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Vue liste">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>

              <Button onClick={onCreateProduct} className="whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affichage produits */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <Package className="h-16 w-16 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Essayez une autre recherche' : 'Créez votre premier produit'}
            </p>
            {!searchTerm && (
              <Button onClick={onCreateProduct} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Créer un produit
              </Button>
            )}
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge variant={
                      product.moderation_status === 'approved' ? 'default' :
                      product.moderation_status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {product.moderation_status === 'approved' ? '✓' : 
                       product.moderation_status === 'pending' ? '⏳' : '✗'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {product.price?.toLocaleString()} CDF
                    </span>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {product.view_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        {product.sales_count || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onEditProduct(product.id)}
                    >
                      Modifier
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <img
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt={product.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{product.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      </div>
                      <Badge variant={
                        product.moderation_status === 'approved' ? 'default' :
                        product.moderation_status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {product.moderation_status === 'approved' ? 'Approuvé' : 
                         product.moderation_status === 'pending' ? 'En attente' : 'Rejeté'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="font-bold text-primary text-xl">
                        {product.price?.toLocaleString()} CDF
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        {product.view_count || 0} vues
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ShoppingCart className="h-4 w-4" />
                        {product.sales_count || 0} ventes
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditProduct(product.id)}
                      >
                        Modifier
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => onDeleteProduct(product.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
