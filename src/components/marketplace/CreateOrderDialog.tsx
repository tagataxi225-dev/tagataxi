import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Package, CreditCard, Minus, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller_id: string;
}

interface CreateOrderDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { createOrder } = useMarketplaceOrders();
  
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = product ? quantity * product.price : 0;

  const handleSubmit = async () => {
    if (!product) return;

    setIsSubmitting(true);
    
    try {
      await createOrder(
        product.id,
        product.seller_id,
        quantity,
        product.price,
        deliveryMethod !== 'pickup' ? deliveryAddress : undefined,
        undefined, // coordinates
        deliveryMethod,
        notes
      );

      toast({
        title: t('marketplace.orderCreated'),
        description: t('marketplace.orderCreatedDesc'),
      });

      onSuccess?.();
      onClose();
      
      // Reset form
      setQuantity(1);
      setDeliveryMethod('pickup');
      setDeliveryAddress('');
      setNotes('');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('marketplace.orderCreateError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Package className="h-6 w-6" />
            Finaliser la commande
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border">
            {product.images[0] && (
              <div className="w-16 h-16 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{product.title}</h3>
              <p className="text-muted-foreground">
                {product.price.toLocaleString()} CDF
              </p>
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="space-y-3">
            <Label htmlFor="quantity" className="text-base font-medium">Quantité</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center w-20 h-10"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Delivery Method */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Mode de livraison</Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">
                  <div className="flex items-center gap-3 py-2">
                    <Package className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Retrait en magasin</div>
                      <div className="text-xs text-muted-foreground">Gratuit</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="home">
                  <div className="flex items-center gap-3 py-2">
                    <MapPin className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Livraison à domicile</div>
                      <div className="text-xs text-muted-foreground">Frais calculés</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="office">
                  <div className="flex items-center gap-3 py-2">
                    <MapPin className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Livraison au bureau</div>
                      <div className="text-xs text-muted-foreground">Frais calculés</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Address */}
          {deliveryMethod !== 'pickup' && (
            <div className="space-y-3">
              <Label htmlFor="address" className="text-base font-medium">Adresse de livraison</Label>
              <Textarea
                id="address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Entrez l'adresse complète de livraison"
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Order Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-medium">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions spéciales, préférences..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3 border">
            <h4 className="font-semibold">Récapitulatif</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total ({quantity} article{quantity > 1 ? 's' : ''})</span>
                <span className="font-medium">{totalAmount.toLocaleString()} CDF</span>
              </div>
              
              {deliveryMethod !== 'pickup' && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frais de livraison</span>
                  <span className="font-medium text-muted-foreground">Calculé après validation</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{totalAmount.toLocaleString()} CDF</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <CreditCard className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Paiement sécurisé</p>
              <p className="text-xs text-muted-foreground">
                Votre paiement est protégé jusqu'à la livraison
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 h-12 font-semibold"
              disabled={isSubmitting || (deliveryMethod !== 'pickup' && !deliveryAddress.trim())}
            >
              {isSubmitting ? 'Traitement...' : 'Confirmer la commande'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};