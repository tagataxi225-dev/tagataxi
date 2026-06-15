import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Package, CreditCard, CheckCircle, ChevronRight } from 'lucide-react';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { CartItem } from '@/types/marketplace';

interface CheckoutFlowProps {
  cartItems: CartItem[];
  onComplete: () => void;
  onClose: () => void;
}

type CheckoutStep = 'cart' | 'address' | 'summary' | 'payment' | 'processing' | 'success';

export const CheckoutFlow = ({ cartItems, onComplete, onClose }: CheckoutFlowProps) => {
  const { toast } = useToast();
  const { createBulkOrder } = useMarketplaceOrders();
  const { latitude, longitude } = useGeolocation();
  
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleNextStep = () => {
    if (step === 'cart') {
      setStep('address');
    } else if (step === 'address') {
      if (!deliveryAddress.trim()) {
        toast({
          title: 'Adresse requise',
          description: 'Veuillez entrer votre adresse de livraison',
          variant: 'destructive'
        });
        return;
      }
      setStep('summary');
    } else if (step === 'summary') {
      handleConfirmPayment();
    }
  };

  const handleConfirmPayment = async () => {
    setStep('processing');

    try {
      const userCoordinates = latitude && longitude 
        ? { lat: latitude, lng: longitude } 
        : undefined;

      const { orderIds, totalAmount: total } = await createBulkOrder(cartItems, userCoordinates);

      setStep('success');
      
      toast({
        title: '✅ Commandes créées !',
        description: `${orderIds.length} commande(s) en attente de validation vendeur. Vous serez notifié des frais de livraison.`,
      });

      setTimeout(() => {
        onComplete();
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      if (error.message.includes('INSUFFICIENT_BALANCE')) {
        toast({
          title: 'Solde insuffisant',
          description: 'Veuillez recharger votre wallet',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Erreur de paiement',
          description: error.message,
          variant: 'destructive'
        });
      }
      
      setStep('summary');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {['cart', 'address', 'summary', 'payment'].map((s, index) => (
        <div key={s} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step === s ? 'bg-primary text-primary-foreground' : 
            ['processing', 'success'].includes(step) || index < ['cart', 'address', 'summary', 'payment'].indexOf(step) 
              ? 'bg-green-500 text-white' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {index + 1}
          </div>
          {index < 3 && (
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );

  if (step === 'processing') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Traitement en cours...</p>
          <p className="text-sm text-muted-foreground mt-2">Création de vos commandes</p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl font-bold mb-2">Commande réussie !</p>
          <p className="text-sm text-muted-foreground">
            Les vendeurs vont valider vos commandes et proposer les frais de livraison
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Commander ({itemCount} article{itemCount > 1 ? 's' : ''})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStepIndicator()}

        {step === 'cart' && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Récapitulatif du panier
            </h3>
            
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantité: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold">{item.price * item.quantity} FC</p>
                </div>
              ))}
            </div>

            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total produits</span>
              <span>{totalAmount} FC</span>
            </div>
            
            <Badge variant="secondary" className="w-full justify-center py-2">
              Les frais de livraison seront proposés par le vendeur après validation
            </Badge>
          </div>
        )}

        {step === 'address' && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Adresse de livraison
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="address">Adresse complète *</Label>
                <Input
                  id="address"
                  placeholder="Ex: 12 Avenue de la Paix, Gombe, Kinshasa"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Instructions de livraison (optionnel)</Label>
                <Input
                  id="notes"
                  placeholder="Ex: Sonnez à l'interphone, bâtiment B"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {step === 'summary' && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Récapitulatif final
            </h3>
            
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Livraison à</p>
                <p className="font-medium">{deliveryAddress}</p>
                {deliveryNotes && (
                  <p className="text-sm text-muted-foreground mt-1">Note: {deliveryNotes}</p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground">Articles</p>
                <p className="font-medium">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total à payer</span>
                <span>{totalAmount} FC</span>
              </div>
            </div>
            
            <Badge variant="outline" className="w-full justify-center py-2">
              Paiement via TembeaPay
            </Badge>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              if (step === 'cart') onClose();
              else if (step === 'address') setStep('cart');
              else if (step === 'summary') setStep('address');
            }}
          >
            {step === 'cart' ? 'Annuler' : 'Retour'}
          </Button>
          
          <Button
            className="flex-1"
            onClick={handleNextStep}
          >
            {step === 'summary' ? 'Confirmer et payer' : 'Continuer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
