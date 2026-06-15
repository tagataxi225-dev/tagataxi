import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { redis } from '@/lib/redis';
import { Package, Plus, CheckCircle, Clock, Search, Archive } from 'lucide-react';
import { ModernVendorProductCard } from './ModernVendorProductCard';
import { StaggerContainer, StaggerItem } from './animations';

interface VendorProductManagerProps {
  onUpdate?: () => void;
  onTabChange?: (tab: string) => void;
}

export const VendorProductManager = ({ onUpdate, onTabChange }: VendorProductManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'stock'>('date');

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const invalidateMarketplaceCache = useCallback(async () => {
    await redis.invalidatePattern('products:popular');
    await redis.invalidatePattern('product');
    queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
    queryClient.invalidateQueries({ queryKey: ['all-marketplace-products'] });
  }, [queryClient]);

  const loadProducts = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, queryClient, toast]);

  // Séparer et filtrer produits
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tri des produits
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.price - a.price;
      case 'stock':
        return (b.stock_count || 0) - (a.stock_count || 0);
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Produits actifs = status active ET moderation approuvée
  const activeProducts = sortedProducts.filter(p => 
    (p.moderation_status === 'approved' || p.moderation_status === 'active') && 
    p.status !== 'inactive'
  );
  const pendingProducts = sortedProducts.filter(p => 
    p.moderation_status === 'pending' && p.status !== 'inactive'
  );
  const rejectedProducts = sortedProducts.filter(p => 
    p.moderation_status === 'rejected' && p.status !== 'inactive'
  );
  // Produits archivés
  const archivedProducts = sortedProducts.filter(p => p.status === 'inactive');

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Section Header Skeleton */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div className="h-8 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted/60 rounded animate-pulse" />
        </motion.div>
        
        {/* Product Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="overflow-hidden">
                <div className="h-48 w-full bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-6 w-3/4 bg-muted/60 rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-muted/60 rounded animate-pulse" />
                  <div className="flex justify-between pt-2">
                    <div className="h-8 w-24 bg-muted/60 rounded animate-pulse" />
                    <div className="h-8 w-16 bg-muted/60 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="py-12 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.5 }}
              transition={{ delay: 0.2 }}
            >
              <Package className="h-12 w-12 mx-auto mb-4" />
            </motion.div>
            <p className="text-muted-foreground mb-4">Vous n'avez pas encore de produits</p>
            <Button onClick={() => navigate('/vendeur/ajouter-produit')}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter mon premier produit
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort Bar - Animation d'entrée */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Trier par..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Plus récents</SelectItem>
            <SelectItem value="price">Prix décroissant</SelectItem>
            <SelectItem value="stock">Stock décroissant</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Section Actifs */}
      <AnimatePresence mode="wait">
        {activeProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-heading-xl font-bold mb-4 flex items-center gap-2 tracking-tight">
              <CheckCircle className="h-7 w-7 text-green-500" />
              Actifs ({activeProducts.length})
            </h2>
            <StaggerContainer 
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              staggerDelay={0.04}
            >
              {activeProducts.map(product => (
                <StaggerItem key={product.id}>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ModernVendorProductCard 
                      product={product}
                      onDelete={async () => { await invalidateMarketplaceCache(); loadProducts(); }}
                    />
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </motion.section>
        )}
      </AnimatePresence>
      
      {/* Section En attente */}
      <AnimatePresence mode="wait">
        {pendingProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="text-heading-xl font-bold mb-4 flex items-center gap-2 tracking-tight">
              <Clock className="h-7 w-7 text-orange-500" />
              En attente de modération ({pendingProducts.length})
            </h2>
            <StaggerContainer 
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              staggerDelay={0.04}
            >
              {pendingProducts.map(product => (
                <StaggerItem key={product.id}>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ModernVendorProductCard 
                      product={product}
                      onDelete={async () => { await invalidateMarketplaceCache(); loadProducts(); }}
                    />
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section Rejetés */}
      <AnimatePresence mode="wait">
        {rejectedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h2 className="text-heading-xl font-bold mb-4 flex items-center gap-2 text-destructive tracking-tight">
              <Package className="h-7 w-7" />
              Rejetés ({rejectedProducts.length})
            </h2>
            <StaggerContainer 
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              staggerDelay={0.04}
            >
              {rejectedProducts.map(product => (
                <StaggerItem key={product.id}>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ModernVendorProductCard 
                      product={product}
                      onDelete={async () => { await invalidateMarketplaceCache(); loadProducts(); }}
                    />
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Section Archivés */}
      <AnimatePresence mode="wait">
        {archivedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h2 className="text-heading-xl font-bold mb-4 flex items-center gap-2 text-muted-foreground tracking-tight">
              <Archive className="h-7 w-7" />
              Archivés ({archivedProducts.length})
            </h2>
            <StaggerContainer 
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              staggerDelay={0.04}
            >
              {archivedProducts.map(product => (
                <StaggerItem key={product.id}>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ModernVendorProductCard 
                      product={product}
                      onDelete={async () => { await invalidateMarketplaceCache(); loadProducts(); }}
                    />
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Bouton ajouter si aucun produit */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <Button onClick={() => navigate('/vendeur/ajouter-produit')} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter mon premier produit
          </Button>
        </div>
      )}
    </div>
  );
};
