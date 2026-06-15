import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Edit3, 
  AlertTriangle,
  Filter,
  Calendar,
  User,
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  condition: string;
  images: string[];
  moderation_status: 'pending' | 'approved' | 'rejected';
  status: string;
  created_at: string;
  updated_at: string;
  seller_id: string;
  seller?: {
    display_name: string;
    phone_number: string;
  };
}

interface ModerationLog {
  id: string;
  action: string;
  admin_notes: string;
  created_at: string;
  moderator_id: string;
  previous_status: string;
  new_status: string;
}

export const ProductModerationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load pending products
  useEffect(() => {
    fetchProducts();
  }, [filterStatus]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('marketplace_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('moderation_status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedProducts = data?.map(product => ({
        ...product,
        seller: {
          display_name: 'Vendeur',
          phone_number: ''
        },
        images: Array.isArray(product.images) ? product.images as string[] : [],
        moderation_status: product.moderation_status as 'pending' | 'approved' | 'rejected'
      })) || [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const moderateProduct = async (productId: string, action: 'approved' | 'rejected', notes?: string) => {
    if (!user) return;

    try {
      // Update product status
      const { error: updateError } = await supabase
        .from('marketplace_products')
        .update({ 
          moderation_status: action,
          status: action === 'approved' ? 'active' : 'inactive'
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Log moderation action
      const { error: logError } = await supabase
        .from('product_moderation_logs')
        .insert({
          product_id: productId,
          moderator_id: user.id,
          action,
          previous_status: selectedProduct?.moderation_status || 'pending',
          new_status: action,
          admin_notes: notes || ''
        });

      if (logError) throw logError;

      toast.success(
        action === 'approved' 
          ? 'Produit approuvé avec succès' 
          : 'Produit rejeté avec succès'
      );

      fetchProducts();
      setSelectedProduct(null);
      setModerationNotes('');
    } catch (error) {
      console.error('Error moderating product:', error);
      toast.error('Erreur lors de la modération');
    }
  };

  const saveProductEdits = async () => {
    if (!editedProduct || !user) return;

    try {
      const { error: updateError } = await supabase
        .from('marketplace_products')
        .update({
          title: editedProduct.title,
          description: editedProduct.description,
          price: editedProduct.price,
          category: editedProduct.category,
          subcategory: editedProduct.subcategory,
          condition: editedProduct.condition
        })
        .eq('id', editedProduct.id);

      if (updateError) throw updateError;

      // Log modification
      const { error: logError } = await supabase
        .from('product_moderation_logs')
        .insert({
          product_id: editedProduct.id,
          moderator_id: user.id,
          action: 'modified',
          previous_status: editedProduct.moderation_status,
          new_status: editedProduct.moderation_status,
          admin_notes: 'Produit modifié par l\'administrateur',
          changes_made: {
            title: editedProduct.title,
            description: editedProduct.description,
            price: editedProduct.price,
            category: editedProduct.category,
            subcategory: editedProduct.subcategory,
            condition: editedProduct.condition
          }
        });

      if (logError) throw logError;

      toast.success('Modifications sauvegardées');
      fetchProducts();
      setEditedProduct(null);
    } catch (error) {
      console.error('Error saving edits:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.seller?.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'default' as const, icon: Clock, label: 'En attente' },
      approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approuvé' },
      rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejeté' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStats = () => {
    return {
      pending: products.filter(p => p.moderation_status === 'pending').length,
      approved: products.filter(p => p.moderation_status === 'approved').length,
      rejected: products.filter(p => p.moderation_status === 'rejected').length,
      total: products.length
    };
  };

  const stats = getStats();

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Modération des produits
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Approuvés</p>
                  <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Rejetés</p>
                  <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par titre ou vendeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products list */}
      <div className="grid gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Product image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {product.images.length > 0 ? (
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

                {/* Product details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground truncate">
                        {product.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Par {product.seller?.display_name}
                      </p>
                    </div>
                    {getStatusBadge(product.moderation_status)}
                  </div>

                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">
                        {product.price.toLocaleString()} FC
                      </span>
                      <span>{product.category}</span>
                      <span>
                        {formatDistance(new Date(product.created_at), new Date(), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View/Edit product */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Modération du produit</DialogTitle>
                          </DialogHeader>

                          {selectedProduct && (
                            <Tabs defaultValue="details" className="space-y-4">
                              <TabsList>
                                <TabsTrigger value="details">Détails</TabsTrigger>
                                <TabsTrigger value="edit">Modifier</TabsTrigger>
                                <TabsTrigger value="moderate">Modérer</TabsTrigger>
                              </TabsList>

                              <TabsContent value="details" className="space-y-4">
                                <div className="grid gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Images</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                      {selectedProduct.images.map((image, index) => (
                                        <img
                                          key={index}
                                          src={image}
                                          alt={`${selectedProduct.title} ${index + 1}`}
                                          className="w-full h-24 object-cover rounded-lg"
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-2">Informations</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Titre:</span>
                                        <span>{selectedProduct.title}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Prix:</span>
                                        <span>{selectedProduct.price.toLocaleString()} FC</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Catégorie:</span>
                                        <span>{selectedProduct.category}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">État:</span>
                                        <span>{selectedProduct.condition}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Vendeur:</span>
                                        <span>{selectedProduct.seller?.display_name}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-medium mb-2">Description</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedProduct.description}
                                    </p>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="edit" className="space-y-4">
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Titre</label>
                                    <Input
                                      value={editedProduct?.title || selectedProduct.title}
                                      onChange={(e) => setEditedProduct({
                                        ...selectedProduct,
                                        ...editedProduct,
                                        title: e.target.value
                                      })}
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Prix (FC)</label>
                                    <Input
                                      type="number"
                                      value={editedProduct?.price || selectedProduct.price}
                                      onChange={(e) => setEditedProduct({
                                        ...selectedProduct,
                                        ...editedProduct,
                                        price: parseFloat(e.target.value)
                                      })}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea
                                      value={editedProduct?.description || selectedProduct.description}
                                      onChange={(e) => setEditedProduct({
                                        ...selectedProduct,
                                        ...editedProduct,
                                        description: e.target.value
                                      })}
                                      rows={4}
                                    />
                                  </div>

                                  <Button onClick={saveProductEdits} className="w-full">
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Sauvegarder les modifications
                                  </Button>
                                </div>
                              </TabsContent>

                              <TabsContent value="moderate" className="space-y-4">
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Notes de modération</label>
                                    <Textarea
                                      value={moderationNotes}
                                      onChange={(e) => setModerationNotes(e.target.value)}
                                      placeholder="Ajoutez vos commentaires (optionnel)..."
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => moderateProduct(selectedProduct.id, 'approved', moderationNotes)}
                                      className="flex-1"
                                      variant="default"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approuver
                                    </Button>
                                    <Button
                                      onClick={() => moderateProduct(selectedProduct.id, 'rejected', moderationNotes)}
                                      className="flex-1"
                                      variant="destructive"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Rejeter
                                    </Button>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>

                      {/* Quick actions for pending products */}
                      {product.moderation_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => moderateProduct(product.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => moderateProduct(product.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-muted-foreground">
                Aucun produit ne correspond à vos critères de recherche.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};