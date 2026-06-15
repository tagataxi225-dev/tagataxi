import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Package,
  Filter,
  Search,
  Clock,
  User,
  X
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingProduct {
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
  seller?: {
    display_name: string;
  };
}

interface AdminModerationQueueProps {
  onBack: () => void;
  onUpdate: () => void;
}

export const AdminModerationQueue: React.FC<AdminModerationQueueProps> = ({ onBack, onUpdate }) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [showProductDetails, setShowProductDetails] = useState(false);

  useEffect(() => {
    loadPendingProducts();
  }, []);

  const loadPendingProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_products')
        .select(`
          *,
          profiles!marketplace_products_seller_id_fkey(display_name)
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setProducts(data.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images as string[] : [],
        seller: { display_name: 'Vendeur' }
      })));
    } catch (error) {
      console.error('Error loading pending products:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits en attente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== 'all' && product.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const handleModerationAction = async (productId: string, action: 'approved' | 'rejected', notes?: string) => {
    try {
      const updates: any = { moderation_status: action };
      
      // Auto-update status based on moderation decision
      if (action === 'approved') {
        updates.status = 'active';
      } else if (action === 'rejected') {
        updates.status = 'inactive';
      }

      const { error } = await supabase
        .from('marketplace_products')
        .update(updates)
        .eq('id', productId);

      if (error) throw error;

      // Log moderation action
      const product = products.find(p => p.id === productId);
      if (product && notes) {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: product.seller_id,
            activity_type: 'product_moderation',
            description: `Produit ${action === 'approved' ? 'approuvé' : 'rejeté'}: ${product.title}`,
            reference_type: 'marketplace_product',
            reference_id: productId,
            metadata: { notes, action }
          });
      }

      toast({
        title: 'Action effectuée',
        description: `Le produit a été ${action === 'approved' ? 'approuvé' : 'rejeté'} avec succès`
      });

      loadPendingProducts();
      onUpdate();
    } catch (error) {
      console.error('Error moderating product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'effectuer l\'action de modération',
        variant: 'destructive'
      });
    }
  };

  const handleBulkModeration = async (action: 'approved' | 'rejected') => {
    if (selectedProducts.length === 0) {
      toast({
        title: 'Aucune sélection',
        description: 'Veuillez sélectionner au moins un produit',
        variant: 'destructive'
      });
      return;
    }

    try {
      const updates: any = { moderation_status: action };
      if (action === 'approved') {
        updates.status = 'active';
      } else if (action === 'rejected') {
        updates.status = 'inactive';
      }

      await supabase
        .from('marketplace_products')
        .update(updates)
        .in('id', selectedProducts);

      // Log bulk actions
      if (moderationNotes) {
        const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
        for (const product of selectedProductsData) {
          await supabase
            .from('activity_logs')
            .insert({
              user_id: product.seller_id,
              activity_type: 'product_moderation',
              description: `Produit ${action === 'approved' ? 'approuvé' : 'rejeté'} en masse: ${product.title}`,
              reference_type: 'marketplace_product',
              reference_id: product.id,
              metadata: { notes: moderationNotes, action, bulk: true }
            });
        }
      }

      toast({
        title: 'Actions effectuées',
        description: `${selectedProducts.length} produits ont été ${action === 'approved' ? 'approuvés' : 'rejetés'}`
      });

      setSelectedProducts([]);
      setModerationNotes('');
      loadPendingProducts();
      onUpdate();
    } catch (error) {
      console.error('Error performing bulk moderation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'effectuer l\'action en masse',
        variant: 'destructive'
      });
    }
  };

  const categories = [...new Set(products.map(p => p.category))];

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
              <h1 className="text-lg font-semibold">File de modération</h1>
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} produit(s) en attente de validation
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {filteredProducts.length} en attente
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filters */}
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {selectedProducts.length} produit(s) sélectionné(s)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleBulkModeration('approved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approuver tout
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleBulkModeration('rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeter tout
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="Notes de modération (optionnel)..."
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>Produits en attente de modération</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun produit en attente</h3>
                <p className="text-muted-foreground">
                  Tous les produits ont été modérés !
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex items-start gap-4 p-4 border rounded-lg">
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
                    
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{product.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {product.seller?.display_name}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-primary">
                          {product.price.toLocaleString()} CDF
                        </span>
                        <span>•</span>
                        <span>{product.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Soumis le {new Date(product.created_at).toLocaleDateString('fr-FR')} à {new Date(product.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
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
                        variant="default"
                        size="sm"
                        onClick={() => handleModerationAction(product.id, 'approved')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleModerationAction(product.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Details Modal */}
      {showProductDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Aperçu du produit</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowProductDetails(false);
                    setSelectedProduct(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Images */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div className="aspect-square max-w-sm mx-auto bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={selectedProduct.images[0]} 
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold">{selectedProduct.title}</h3>
                <p className="text-2xl font-bold text-primary mt-1">
                  {selectedProduct.price.toLocaleString()} CDF
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Vendeur:</span>
                  <p>{selectedProduct.seller?.display_name}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Catégorie:</span>
                  <p>{selectedProduct.category}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">État:</span>
                  <p>{selectedProduct.condition}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Soumis le:</span>
                  <p>{new Date(selectedProduct.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-muted-foreground">Description:</span>
                <p className="mt-1">{selectedProduct.description}</p>
              </div>

              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">Action de modération</Label>
                <Textarea
                  placeholder="Notes de modération (optionnel)..."
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={() => {
                      handleModerationAction(selectedProduct.id, 'approved', moderationNotes);
                      setShowProductDetails(false);
                      setSelectedProduct(null);
                      setModerationNotes('');
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => {
                      handleModerationAction(selectedProduct.id, 'rejected', moderationNotes);
                      setShowProductDetails(false);
                      setSelectedProduct(null);
                      setModerationNotes('');
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};