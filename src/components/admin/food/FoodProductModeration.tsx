import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, Loader2 } from 'lucide-react';
import { useAdminFoodProducts } from '@/hooks/admin/useAdminFoodProducts';

export const FoodProductModeration = () => {
  const { products, moderating, fetchPendingProducts, approveProduct, rejectProduct } = useAdminFoodProducts();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const handleApprove = async () => {
    if (selectedProduct) {
      await approveProduct(selectedProduct.id);
      setSelectedProduct(null);
    }
  };

  const handleReject = async () => {
    if (selectedProduct && rejectReason) {
      await rejectProduct(selectedProduct.id, rejectReason, rejectComment);
      setRejectDialogOpen(false);
      setSelectedProduct(null);
      setRejectReason('');
      setRejectComment('');
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Liste produits en attente */}
      <Card>
        <CardHeader>
          <CardTitle>Produits en attente ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun produit en attente de modération
              </div>
            ) : (
              products.map((product) => (
                <Card
                  key={product.id}
                  className={`mb-4 cursor-pointer transition-all ${
                    selectedProduct?.id === product.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {product.main_image_url && (
                        <img
                          src={product.main_image_url}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                        <p className="text-sm font-medium mt-1">{formatPrice(product.price)}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {product.restaurant.restaurant_name} • {new Date(product.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Détails + Actions */}
      {selectedProduct ? (
        <Card>
          <CardHeader>
            <CardTitle>Détails du produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vidéo produit */}
            {selectedProduct.video_url && (
              <div className="relative rounded-lg overflow-hidden border bg-black">
                <Badge variant="secondary" className="absolute top-2 left-2 z-10 bg-black/70 text-white text-[10px]">🎬 Vidéo</Badge>
                <video
                  src={selectedProduct.video_url}
                  controls
                  className="w-full max-h-64 object-contain"
                  preload="metadata"
                />
              </div>
            )}

            {/* Image principale */}
            {selectedProduct.main_image_url && (
              <img
                src={selectedProduct.main_image_url}
                alt={selectedProduct.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            {/* Informations */}
            <div className="space-y-3">
              <div>
                <Label>Nom</Label>
                <p className="text-lg font-semibold">{selectedProduct.name}</p>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedProduct.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <p><Badge>{selectedProduct.category}</Badge></p>
                </div>
                <div>
                  <Label>Prix</Label>
                  <p className="font-semibold">{formatPrice(selectedProduct.price)}</p>
                </div>
              </div>

              <div>
                <Label>Temps de préparation</Label>
                <p>{selectedProduct.preparation_time} minutes</p>
              </div>

              <div>
                <Label>Restaurant</Label>
                <p className="font-medium">{selectedProduct.restaurant.restaurant_name}</p>
                <p className="text-sm text-muted-foreground">{selectedProduct.restaurant.city}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={handleApprove}
                disabled={moderating}
              >
                {moderating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Check className="h-4 w-4 mr-2" />
                Approuver
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setRejectDialogOpen(true)}
                disabled={moderating}
              >
                <X className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-[600px] text-muted-foreground">
            Sélectionnez un produit pour voir les détails
          </CardContent>
        </Card>
      )}

      {/* Dialog rejet */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Raison du rejet</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image_quality">Image de mauvaise qualité</SelectItem>
                  <SelectItem value="inappropriate_content">Contenu inapproprié</SelectItem>
                  <SelectItem value="misleading_description">Description trompeuse</SelectItem>
                  <SelectItem value="wrong_category">Catégorie incorrecte</SelectItem>
                  <SelectItem value="unreasonable_price">Prix déraisonnable</SelectItem>
                  <SelectItem value="duplicate">Produit en double</SelectItem>
                  <SelectItem value="other">Autre raison</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Commentaire (optionnel)</Label>
              <Textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Détaillez la raison du rejet..."
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason || moderating}
            >
              {moderating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmer le rejet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
