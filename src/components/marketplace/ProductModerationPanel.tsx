import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, CheckCircle, XCircle, Clock, Eye, AlertCircle, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  video_url?: string;
  seller_id: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  seller?: {
    display_name: string;
    email: string;
  };
}

export const ProductModerationPanel: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formatCurrency } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fonction pour charger les produits (mémorisée)
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Récupérer les produits sans foreign key
      let query = supabase
        .from('marketplace_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('moderation_status', filterStatus);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data: productsData, error } = await query;
      if (error) throw error;

      // Récupérer les informations des vendeurs séparément
      const sellerIds = [...new Set(productsData?.map(p => p.seller_id))];
      const sellersInfo: Record<string, { display_name: string; email: string }> = {};

      for (const sellerId of sellerIds) {
        // Essayer depuis seller_profiles d'abord
        const { data: sellerProfile } = await supabase
          .from('seller_profiles')
          .select('display_name, user_id')
          .eq('user_id', sellerId)
          .maybeSingle();

        if (sellerProfile) {
          // Récupérer l'email depuis clients
          const { data: clientData } = await supabase
            .from('clients')
            .select('email')
            .eq('user_id', sellerId)
            .maybeSingle();

          sellersInfo[sellerId] = {
            display_name: sellerProfile.display_name,
            email: clientData?.email || 'Email non disponible'
          };
        } else {
          // Fallback vers clients directement
          const { data: clientData } = await supabase
            .from('clients')
            .select('display_name, email')
            .eq('user_id', sellerId)
            .maybeSingle();

          if (clientData) {
            sellersInfo[sellerId] = {
              display_name: clientData.display_name,
              email: clientData.email
            };
          } else {
            sellersInfo[sellerId] = {
              display_name: 'Vendeur inconnu',
              email: 'Email non disponible'
            };
          }
        }
      }

      // Combiner les données avec typage correct
      const productsWithSellers = productsData?.map(product => ({
        ...product,
        images: Array.isArray(product.images) ? product.images : [],
        seller: sellersInfo[product.seller_id]
      })) || [];

      setProducts(productsWithSellers as Product[]);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, categoryFilter, toast]);

  // Effect 1: Vérifier les permissions admin (sans useCallback pour éviter la boucle)
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setIsAdmin(false);
        setCheckingPermissions(false);
        return;
      }

      try {
        setCheckingPermissions(true);
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .eq('is_active', true)
          .maybeSingle();

        setIsAdmin(!!data && !error);
      } catch (error) {
        console.error('Error checking admin permissions:', error);
        setIsAdmin(false);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkPermissions();
  }, [user?.id]); // Uniquement dépendre de user.id pour éviter les re-renders inutiles

  // Effect 2: Charger les produits quand isAdmin change
  useEffect(() => {
    if (isAdmin) {
      loadProducts();
    }
  }, [isAdmin, loadProducts]);

  // Effect 3: Subscription temps réel pour nouveaux produits en attente (PHASE 1.2)
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('marketplace-moderation-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'marketplace_products',
        filter: 'moderation_status=eq.pending'
      }, (payload) => {
        console.log('📢 Nouveau produit à modérer:', payload);
        toast({
          title: '🆕 Nouveau produit à modérer',
          description: `"${payload.new.title}" en attente d'approbation`,
        });
        loadProducts(); // Rafraîchir la liste
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'marketplace_products',
        filter: 'moderation_status=eq.pending'
      }, () => {
        loadProducts(); // Rafraîchir si un produit pending est modifié
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, toast, loadProducts]);

  const moderateProduct = async (productId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setActionLoading(true);

      const { data, error } = await supabase.functions.invoke('moderate-product', {
        body: {
          productId,
          action,
          rejectionReason: reason
        }
      });

      if (error) throw error;

      toast({
        title: action === 'approve' ? 'Produit approuvé' : 'Produit rejeté',
        description: action === 'approve' 
          ? 'Le produit est maintenant visible sur la marketplace'
          : 'Le vendeur a été notifié du rejet',
      });

      setSelectedProduct(null);
      setRejectionReason('');
      loadProducts();
    } catch (error: any) {
      console.error('Error moderating product:', error);
      const errorMessage = error?.message || error?.error || 'Erreur inconnue lors de la modération';
      console.error('Détails de l\'erreur:', {
        error,
        productId,
        action,
        reason
      });
      toast({
        title: 'Erreur de modération',
        description: `Impossible de modérer le produit. ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'En attente' },
      approved: { variant: 'default', icon: CheckCircle, label: 'Approuvé' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejeté' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (checkingPermissions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {!user 
              ? 'Vous devez être connecté pour accéder à cette page.'
              : 'Accès refusé. Cette page est réservée aux administrateurs.'
            }
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h3 className="font-semibold text-lg mb-2">Accès restreint</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Seuls les administrateurs peuvent accéder au panneau de modération des produits.
            </p>
            <Button onClick={() => navigate(user ? '/' : '/auth')}>
              {user ? 'Retour à l\'accueil' : 'Se connecter'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Modération des produits</h2>
          <p className="text-muted-foreground">Approuver ou rejeter les produits soumis par les vendeurs</p>
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="electronics">Électronique</SelectItem>
              <SelectItem value="fashion">Mode & Vêtements</SelectItem>
              <SelectItem value="home">Maison & Jardin</SelectItem>
              <SelectItem value="beauty">Beauté & Santé</SelectItem>
              <SelectItem value="sports">Sports & Loisirs</SelectItem>
              <SelectItem value="food">Alimentation</SelectItem>
              <SelectItem value="auto">Automobile</SelectItem>
              <SelectItem value="books">Livres & Éducation</SelectItem>
              <SelectItem value="baby">Jouets & Bébé</SelectItem>
              <SelectItem value="games">Jeux Vidéo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les produits</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardContent className="space-y-2 p-4">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun produit à modérer</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {filterStatus === 'pending' 
                ? 'Tous les produits ont été traités'
                : `Aucun produit ${filterStatus === 'approved' ? 'approuvé' : 'rejeté'} pour le moment`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {product.video_url && (
                    <Badge variant="secondary" className="bg-black/70 text-white text-[10px] px-1.5">
                      🎬 Vidéo
                    </Badge>
                  )}
                  {getStatusBadge(product.moderation_status)}
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{formatCurrency(product.price, 'XOF')}</span>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Vendeur: {product.seller?.display_name || 'Inconnu'}
                </div>
                {product.rejection_reason && (
                  <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-xs text-destructive">{product.rejection_reason}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowDetailsDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  {product.moderation_status === 'pending' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => moderateProduct(product.id, 'approve')}
                        disabled={actionLoading}
                        title="Approuver"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setRejectionReason('');
                          setShowRejectionDialog(true);
                        }}
                        disabled={actionLoading}
                        title="Rejeter"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {product.moderation_status === 'approved' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setRejectionReason('');
                        setShowRejectionDialog(true);
                      }}
                      disabled={actionLoading}
                      title="Rejeter ce produit"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeter
                    </Button>
                  )}
                  {product.moderation_status === 'rejected' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => moderateProduct(product.id, 'approve')}
                      disabled={actionLoading}
                      title="Réapprouver ce produit"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approuver
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog 
        open={showDetailsDialog} 
        onOpenChange={(open) => {
          setShowDetailsDialog(open);
          if (!open) setSelectedProduct(null);
        }}
      >
        {selectedProduct && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du produit</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Video */}
              {selectedProduct.video_url && (
                <div className="relative rounded-lg overflow-hidden border bg-black">
                  <Badge variant="secondary" className="absolute top-2 left-2 z-10 bg-black/70 text-white">🎬 Vidéo produit</Badge>
                  <video
                    src={selectedProduct.video_url}
                    controls
                    className="w-full max-h-72 object-contain"
                    preload="metadata"
                  />
                </div>
              )}

              {/* Image Gallery */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  selectedProduct.images.map((image, index) => (
                    <div key={index} className="aspect-square relative rounded-lg overflow-hidden border">
                      <img
                        src={image}
                        alt={`${selectedProduct.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="aspect-square bg-muted flex items-center justify-center rounded-lg border">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{selectedProduct.title}</h3>
                  <p className="text-muted-foreground">{selectedProduct.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Prix</span>
                    <p className="font-bold text-xl">{formatCurrency(selectedProduct.price, 'XOF')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Catégorie</span>
                    <p className="font-medium">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Condition</span>
                    <p className="font-medium capitalize">{selectedProduct.condition}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <div className="mt-1">{getStatusBadge(selectedProduct.moderation_status)}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <span className="text-sm text-muted-foreground">Vendeur</span>
                  <p className="font-medium">{selectedProduct.seller?.display_name || 'Inconnu'}</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.seller?.email}</p>
                </div>

                {selectedProduct.rejection_reason && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Raison du rejet</p>
                      <p className="text-sm text-destructive/80">{selectedProduct.rejection_reason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <DialogFooter className="gap-2">
                {selectedProduct.moderation_status === 'pending' && (
                  <>
                    <Button
                      variant="default"
                      onClick={() => {
                        moderateProduct(selectedProduct.id, 'approve');
                        setShowDetailsDialog(false);
                      }}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowRejectionDialog(true);
                      }}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </>
                )}
                {selectedProduct.moderation_status === 'approved' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      setShowRejectionDialog(true);
                    }}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter ce produit
                  </Button>
                )}
                {selectedProduct.moderation_status === 'rejected' && (
                  <Button
                    variant="default"
                    onClick={() => {
                      moderateProduct(selectedProduct.id, 'approve');
                      setShowDetailsDialog(false);
                    }}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Réapprouver
                  </Button>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog 
        open={showRejectionDialog} 
        onOpenChange={(open) => {
          setShowRejectionDialog(open);
          if (!open) {
            setRejectionReason('');
            setSelectedProduct(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Raison du rejet</label>
              <Textarea
                placeholder="Expliquez pourquoi ce produit est rejeté..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectionReason('Images de mauvaise qualité ou inappropriées')}
              >
                Images inappropriées
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectionReason('Description insuffisante ou trompeuse')}
              >
                Description incorrecte
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectionReason('Prix anormalement élevé ou suspect')}
              >
                Prix suspect
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectionReason('Produit interdit ou contrefait')}
              >
                Produit interdit
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectionDialog(false);
              setRejectionReason('');
              setSelectedProduct(null);
            }}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedProduct && rejectionReason.trim()) {
                  moderateProduct(selectedProduct.id, 'reject', rejectionReason);
                  setShowRejectionDialog(false);
                }
              }}
              disabled={!rejectionReason.trim() || actionLoading}
            >
              {actionLoading ? 'Traitement...' : 'Confirmer le rejet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};