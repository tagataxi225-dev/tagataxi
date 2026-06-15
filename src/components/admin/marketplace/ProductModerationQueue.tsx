import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye, AlertCircle, User, Store, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SellerProfile {
  display_name: string;
  avatar_url?: string;
  verified_seller: boolean;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  category: string;
  condition: string;
  images: any;
  stock_count: number;
  brand?: string;
  specifications?: any;
  moderation_status: string;
  seller_id: string;
  created_at: string;
}

export function ProductModerationQueue() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending products
  const { data: pendingProducts, isLoading } = useQuery({
    queryKey: ['pendingProducts', categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_products')
        .select('*')
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: true });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch seller profiles separately
      const productsWithSellers = await Promise.all(
        (data || []).map(async (product) => {
          const { data: seller } = await supabase
            .from('seller_profiles')
            .select('display_name, avatar_url, verified_seller')
            .eq('user_id', product.seller_id)
            .single();

          return {
            ...product,
            seller_profile: seller
          };
        })
      );

      return productsWithSellers;
    }
  });

  // Moderate product mutation
  const moderateProduct = useMutation({
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pendingProducts'] });
      queryClient.invalidateQueries({ queryKey: ['marketplaceStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      
      toast({
        title: "Succès",
        description: variables.action === 'approve' 
          ? "Produit approuvé avec succès" 
          : "Produit rejeté avec succès",
      });
      
      setSelectedProduct(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la modération",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (productId: string) => {
    moderateProduct.mutate({ productId, action: 'approve' });
  };

  const handleReject = (productId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez fournir une raison de rejet",
        variant: "destructive",
      });
      return;
    }
    moderateProduct.mutate({ productId, action: 'reject', rejectionReason: reason });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement des produits en attente...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File d'attente de modération</h2>
          <p className="text-muted-foreground">
            {pendingProducts?.length || 0} produit(s) en attente de modération
          </p>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            <SelectItem value="electronics">Électronique</SelectItem>
            <SelectItem value="fashion">Mode</SelectItem>
            <SelectItem value="home">Maison</SelectItem>
            <SelectItem value="beauty">Beauté</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!pendingProducts || pendingProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Aucun produit en attente</p>
            <p className="text-sm text-muted-foreground">Tous les produits ont été modérés</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square relative overflow-hidden bg-muted">
                {product.images && Array.isArray(product.images) && product.images.length > 0 ? (
                  <img
                    src={String(product.images[0])}
                    alt={product.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2" variant="secondary">
                  {product.category}
                </Badge>
              </div>
              
              <CardHeader className="space-y-2">
                <CardTitle className="line-clamp-1">{product.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {product.description}
                </CardDescription>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-2xl font-bold">
                    {product.price.toLocaleString()} {(product as any).currency || 'CDF'}
                  </span>
                  <Badge variant="outline">{product.condition}</Badge>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{(product as any).seller_profile?.display_name || 'Vendeur inconnu'}</span>
                  {(product as any).seller_profile?.verified_seller && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>

                {/* Infos vendeur */}
                <div className="space-y-2">
                  {product.brand && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{product.brand}</span>
                    </div>
                  )}

                  {/* Stock avec badge coloré */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Stock:</span>
                    <Badge 
                      variant="outline" 
                      className={
                        product.stock_count === 0 ? "bg-gray-100 text-gray-800" :
                        product.stock_count <= 4 ? "bg-red-100 text-red-800" :
                        product.stock_count <= 20 ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }
                    >
                      {product.stock_count === 0 ? "Rupture" : `${product.stock_count} unités`}
                    </Badge>
                  </div>

                  {/* Vérifications automatiques */}
                  <div className="pt-2 space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground">Vérifications:</div>
                    {/* Check images */}
                    {(() => {
                      const imgArray = Array.isArray(product.images) ? product.images : [];
                      return imgArray.length >= 3 ? (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Images de qualité ({imgArray.length})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>Peu d'images ({imgArray.length})</span>
                        </div>
                      );
                    })()}
                    {/* Check description */}
                    {product.description && product.description.length > 100 ? (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Description détaillée</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-yellow-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>Description courte</span>
                      </div>
                    )}
                    {/* Check prix */}
                    {product.price > 0 && product.price < 10000000 ? (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Prix cohérent</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>Prix suspect</span>
                      </div>
                    )}
                    {/* Check stock */}
                    {product.stock_count > 0 && product.stock_count < 1000 ? (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Stock raisonnable</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-yellow-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>Stock inhabitueljeu</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{product.title}</DialogTitle>
                        <DialogDescription>
                          Vérifiez toutes les informations avant de modérer
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {/* Images */}
                        {product.images && Array.isArray(product.images) && product.images.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {product.images.map((img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`${product.title} ${idx + 1}`}
                                className="aspect-square object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        <div>
                          <Label>Description</Label>
                          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        </div>

                        {/* Specs */}
                        {product.specifications && typeof product.specifications === 'object' && Object.keys(product.specifications).length > 0 && (
                          <div>
                            <Label>Spécifications</Label>
                            <div className="mt-2 space-y-1">
                              {Object.entries(product.specifications as Record<string, string>).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="font-medium">{key}:</span>
                                  <span className="text-muted-foreground">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-2 pt-4">
                          <Button
                            className="flex-1"
                            onClick={() => handleApprove(product.id)}
                            disabled={moderateProduct.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" className="flex-1">
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeter
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rejeter le produit</DialogTitle>
                                <DialogDescription>
                                  Indiquez la raison du rejet
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Raison du rejet (obligatoire)"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  rows={4}
                                />
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                  onClick={() => handleReject(product.id, rejectionReason)}
                                  disabled={moderateProduct.isPending || !rejectionReason.trim()}
                                >
                                  Confirmer le rejet
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex space-x-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleApprove(product.id)}
                    disabled={moderateProduct.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rejeter le produit</DialogTitle>
                        <DialogDescription>
                          Indiquez la raison du rejet
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Raison du rejet (obligatoire)"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                        />
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleReject(product.id, rejectionReason)}
                          disabled={moderateProduct.isPending || !rejectionReason.trim()}
                        >
                          Confirmer le rejet
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
