import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Edit, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { EditProductForm } from './EditProductForm';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  images: string[];
  moderation_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export const VendorProductsList: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match Product interface
      const transformedProducts: Product[] = (data || []).map(item => ({
        id: item.id,
        title: item.title || '',
        description: item.description || '',
        price: item.price || 0,
        category: item.category || '',
        condition: item.condition || '',
        status: item.status || 'active',
        images: Array.isArray(item.images) ? item.images.filter((img): img is string => typeof img === 'string') : [],
        moderation_status: item.moderation_status as 'pending' | 'approved' | 'rejected',
        rejection_reason: item.rejection_reason || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de charger vos produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('vendor-products-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_products',
          filter: `seller_id=eq.${user?.id}`
        },
        (payload) => {
          // Show notification when product status changes
          const newProduct = payload.new as Product;
          const oldProduct = payload.old as Product;

          if (oldProduct.moderation_status !== newProduct.moderation_status) {
            if (newProduct.moderation_status === 'approved') {
              toast({
                title: "✅ Produit approuvé",
                description: `"${newProduct.title}" est maintenant en ligne !`
              });
            } else if (newProduct.moderation_status === 'rejected') {
              toast({
                title: "❌ Produit rejeté",
                description: `"${newProduct.title}" a été rejeté. Raison: ${newProduct.rejection_reason}`,
                variant: "destructive"
              });
            }
          }

          // Refresh list
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (editingProduct) {
    return (
      <EditProductForm
        product={editingProduct}
        onBack={() => setEditingProduct(null)}
        onUpdate={fetchProducts}
      />
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default:
        return null;
    }
  };

  const isDraft = (product: Product) => product.status === 'inactive' && (product.images?.length === 0);

  const canEdit = (product: Product) => {
    // Can only edit if approved or rejected (not pending)
    return product.moderation_status === 'approved' || product.moderation_status === 'rejected';
  };

  return (
    <div className="flex-1 bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border/40 backdrop-blur-md">
        <div className="flex items-center gap-4 px-4 py-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Mes produits</h1>
            <p className="text-sm text-muted-foreground">{products.length} produit{products.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
              <p className="text-sm text-muted-foreground">Vous n'avez pas encore mis de produit en vente</p>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1">{product.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{product.description}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(product.moderation_status)}
                    {isDraft(product) && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500/20">
                        <AlertCircle className="w-3 h-3 mr-1" />Draft
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Image + Price */}
                <div className="flex items-center gap-4">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.title}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-lg border flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-primary">{product.price.toLocaleString()} CDF</p>
                    <p className="text-xs text-muted-foreground">Catégorie: {product.category}</p>
                  </div>
                </div>

                {/* Rejection Reason */}
                {product.moderation_status === 'rejected' && product.rejection_reason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Raison du rejet:
                    </p>
                    <p className="text-xs text-destructive/80">{product.rejection_reason}</p>
                  </div>
                )}

                {/* Draft Message */}
                {isDraft(product) && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-xs font-semibold text-orange-700 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Produit incomplet (sans images)
                    </p>
                    <p className="text-xs text-orange-700/80">
                      Certaines images n'ont pas pu être uploadées. Vous pouvez modifier le produit pour réessayer.
                    </p>
                  </div>
                )}

                {/* Pending Message */}
                {product.moderation_status === 'pending' && !isDraft(product) && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-xs text-yellow-700">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Votre produit est en cours de vérification par notre équipe.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingProduct(product)}
                    disabled={!canEdit(product)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // TODO: View product details
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>

                {!canEdit(product) && (
                  <p className="text-xs text-muted-foreground text-center">
                    Modification désactivée pendant la modération
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
