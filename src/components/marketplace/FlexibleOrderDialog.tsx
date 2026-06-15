import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Package, CreditCard, Minus, Plus, Wallet, Smartphone, Navigation, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import MobileMoneyPayment from '@/components/advanced/MobileMoneyPayment';
import { ClientLocationPicker } from './ClientLocationPicker';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller_id: string;
}

interface FlexibleOrderDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCreateOrder: (orderData: OrderData) => Promise<void>;
}

interface OrderData {
  productId: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
  deliveryAddress?: string;
  deliveryCoordinates?: any;
  deliveryMethod: string;
  notes?: string;
  paymentMethod: 'wallet' | 'mobile_money';
  paymentData?: any;
}

export const FlexibleOrderDialog: React.FC<FlexibleOrderDialogProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
  onCreateOrder
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const geolocation = useGeolocation();
  const geoLoading = geolocation.loading;
  
  const [step, setStep] = useState<'details' | 'payment' | 'mobile_money'>('details');
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('pickup');
  const [deliveryLocation, setDeliveryLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'mobile_money'>('wallet');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DELIVERY_FEE = 7000; // Fixed delivery fee
  const subtotal = product ? quantity * product.price : 0;
  const totalAmount = subtotal + (deliveryMethod !== 'pickup' ? DELIVERY_FEE : 0);

  // Supprimé - géré par ClientLocationPicker

  const handleSubmitOrder = async (paymentData?: any) => {
    if (!product) return;

    setIsSubmitting(true);
    
    try {
      const orderData: OrderData = {
        productId: product.id,
        sellerId: product.seller_id,
        quantity,
        unitPrice: product.price,
        deliveryAddress: deliveryMethod !== 'pickup' ? deliveryLocation?.address : undefined,
        deliveryCoordinates: deliveryMethod !== 'pickup' ? { 
          lat: deliveryLocation!.lat, 
          lng: deliveryLocation!.lng 
        } : undefined,
        deliveryMethod,
        notes,
        paymentMethod,
        paymentData
      };

      await onCreateOrder(orderData);

      toast({
        title: "Commande créée",
        description: "Votre commande a été créée avec succès",
      });

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la commande",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('details');
    setQuantity(1);
    setDeliveryMethod('pickup');
    setDeliveryLocation(null);
    setNotes('');
    setPaymentMethod('wallet');
    onClose();
  };

  const handleNextStep = () => {
    if (deliveryMethod !== 'pickup' && !deliveryLocation) {
      toast({
        title: "Position requise",
        description: "Veuillez sélectionner votre position de livraison sur la carte",
        variant: "destructive",
      });
      return;
    }
    setStep('payment');
  };

  const handlePaymentMethodSelect = () => {
    if (paymentMethod === 'mobile_money') {
      setStep('mobile_money');
    } else {
      handleSubmitOrder();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Package className="h-6 w-6" />
            {step === 'details' && 'Détails de la commande'}
            {step === 'payment' && 'Mode de paiement'}
            {step === 'mobile_money' && 'Paiement Mobile Money'}
          </DialogTitle>
        </DialogHeader>

        {step === 'details' && (
          <div className="space-y-6">
            {/* Product Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
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
              </CardContent>
            </Card>

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
                        <div className="font-medium">Livraison Flash (Moto)</div>
                        <div className="text-xs text-muted-foreground">7,000 FC</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mini-carte interactive de localisation */}
            {deliveryMethod !== 'pickup' && (
              <ClientLocationPicker
                value={deliveryLocation}
                onChange={setDeliveryLocation}
                label="📍 Où souhaitez-vous être livré ?"
                initialCenter={{ lat: -4.3217, lng: 15.3125 }}
                required
              />
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
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold">Récapitulatif</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total ({quantity} article{quantity > 1 ? 's' : ''})</span>
                    <span className="font-medium">{subtotal.toLocaleString()} CDF</span>
                  </div>
                  
                  {deliveryMethod !== 'pickup' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Livraison Flash</span>
                      <span className="font-medium">{DELIVERY_FEE.toLocaleString()} CDF</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{totalAmount.toLocaleString()} CDF</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-12"
              >
                Annuler
              </Button>
              <Button
                onClick={handleNextStep}
                className="flex-1 h-12 font-semibold"
                disabled={deliveryMethod !== 'pickup' && !deliveryLocation}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total à payer</span>
                  <span className="text-2xl font-bold text-primary">{totalAmount.toLocaleString()} CDF</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Choisissez votre mode de paiement</Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(value: 'wallet' | 'mobile_money') => setPaymentMethod(value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                    <Card className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-base">Portefeuille TembeaPay</p>
                          <p className="text-sm text-muted-foreground">Paiement instantané depuis votre solde</p>
                        </div>
                        <Badge variant="secondary">Recommandé</Badge>
                      </div>
                    </Card>
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <Label htmlFor="mobile_money" className="flex-1 cursor-pointer">
                    <Card className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <Smartphone className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-base">Mobile Money</p>
                          <p className="text-sm text-muted-foreground">Airtel Money, Orange Money, M-Pesa</p>
                        </div>
                        <Badge variant="outline">Disponible</Badge>
                      </div>
                    </Card>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Paiement sécurisé</p>
                <p className="text-xs text-muted-foreground">
                  Votre paiement est protégé jusqu'à la livraison. Remboursement garanti en cas de problème.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep('details')}
                className="flex-1 h-12"
              >
                Retour
              </Button>
              <Button
                onClick={handlePaymentMethodSelect}
                className="flex-1 h-12 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Traitement...' : 'Confirmer le paiement'}
              </Button>
            </div>
          </div>
        )}

        {step === 'mobile_money' && (
          <div className="space-y-6">
            <MobileMoneyPayment
              amount={totalAmount}
              currency="CDF"
              orderType="marketplace"
              onSuccess={(transactionId) => {
                handleSubmitOrder({ transactionId, method: 'mobile_money' });
              }}
              onCancel={() => setStep('payment')}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};