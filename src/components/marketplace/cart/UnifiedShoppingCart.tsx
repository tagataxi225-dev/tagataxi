import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Plus, Minus, Trash2, Store, Shield, CheckCircle, Loader2, Wallet, MapPin, Phone, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCartItem } from './AnimatedCartItem';
import { CartEmptyState } from './CartEmptyState';
import { KwendaPayCheckout } from './KwendaPayCheckout';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { UnifiedTopUpModal } from '@/components/wallet/UnifiedTopUpModal';
import { useWallet } from '@/hooks/useWallet';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/types/marketplace';

interface UnifiedShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  userCoordinates?: { lat: number; lng: number };
}

type CheckoutStep = 'cart' | 'delivery' | 'processing' | 'success';

export const UnifiedShoppingCart: React.FC<UnifiedShoppingCartProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  userCoordinates,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { createBulkOrder } = useMarketplaceOrders();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  
  // Nouveaux champs livraison
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [deliveryErrors, setDeliveryErrors] = useState<{address?: string; phone?: string}>({});

  // Calculs
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Grouper les items par vendeur pour affichage
  const vendorGroups = cartItems.reduce((groups, item) => {
    if (!groups[item.seller_id]) {
      groups[item.seller_id] = {
        sellerId: item.seller_id,
        sellerName: item.seller,
        items: [],
        total: 0
      };
    }
    groups[item.seller_id].items.push(item);
    groups[item.seller_id].total += item.price * item.quantity;
    return groups;
  }, {} as Record<string, { sellerId: string; sellerName: string; items: CartItem[]; total: number }>);

  const vendorCount = Object.keys(vendorGroups).length;

  // Validation du formulaire de livraison
  const validateDeliveryForm = () => {
    const errors: {address?: string; phone?: string} = {};
    
    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 10) {
      errors.address = "Adresse de livraison trop courte (min. 10 caractères)";
    }
    
    const phoneClean = buyerPhone.replace(/\D/g, '');
    if (!phoneClean || phoneClean.length < 9) {
      errors.phone = "Numéro de téléphone invalide (min. 9 chiffres)";
    }
    
    setDeliveryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToDelivery = () => {
    if (!wallet || wallet.balance < totalPrice) {
      toast({
        title: 'Solde insuffisant',
        description: `Vous avez besoin de ${totalPrice.toLocaleString()} CDF mais votre solde est de ${wallet?.balance?.toLocaleString() || 0} CDF`,
        variant: 'destructive',
      });
      return;
    }
    setCheckoutStep('delivery');
  };

  const handleConfirmDelivery = () => {
    if (!validateDeliveryForm()) {
      toast({
        title: 'Informations incomplètes',
        description: 'Veuillez remplir tous les champs correctement',
        variant: 'destructive',
      });
      return;
    }
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async () => {
    setShowPaymentDialog(false);
    setCheckoutStep('processing');
    setIsProcessing(true);

    try {
      // ✅ Appeler edge function sécurisée avec adresse et téléphone
      const { data, error } = await supabase.functions.invoke('process-marketplace-checkout', {
        body: {
          cartItems: cartItems.map(item => ({
            id: item.id,
            product_id: item.product_id || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            seller_id: item.seller_id
          })),
          userId: user?.id,
          userCoordinates,
          deliveryAddress: deliveryAddress.trim(),
          buyerPhone: buyerPhone.trim()
        }
      });

      if (error) throw error;

      setCheckoutStep('success');
      setShowConfetti(true);

      toast({
        title: '✅ Paiement réussi !',
        description: `${data.orderIds.length} commande(s) créée(s) • ${data.totalAmount.toLocaleString()} CDF ${data.paidWithBonus ? '(bonus)' : ''}`,
      });

      // Vider le panier et fermer après 2 secondes
      setTimeout(() => {
        cartItems.forEach(item => onRemoveItem(item.id));
        onClose();
        setCheckoutStep('cart');
        setShowConfetti(false);
        setDeliveryAddress('');
        setBuyerPhone('');
      }, 2000);

    } catch (error: any) {
      console.error('Checkout error:', error);
      setCheckoutStep('delivery');
      
      toast({
        title: 'Erreur de paiement',
        description: error.message || 'Veuillez réessayer',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Calcul du montant nécessaire pour recharge
  const amountNeeded = Math.max(0, totalPrice - (wallet?.balance || 0));
  const isSufficientBalance = wallet && wallet.balance >= totalPrice;

  const renderCartView = () => (
    <>
      {/* Header épuré - soft-modern */}
      <div className="bg-background border-b px-4 py-3">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-xl">
                <ShoppingBag className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <span className="text-lg font-semibold">Mon Panier</span>
                <p className="text-sm text-muted-foreground font-normal">
                  {totalItems} article{totalItems > 1 ? 's' : ''} • {vendorCount} vendeur{vendorCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {cartItems.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const confirmMessage = `Voulez-vous vraiment vider le panier ?\n\n📦 ${totalItems} article${totalItems > 1 ? 's' : ''}\n💰 ${totalPrice.toLocaleString()} CDF`;
                  
                  if (confirm(confirmMessage)) {
                    cartItems.forEach((item, index) => {
                      setTimeout(() => onRemoveItem(item.id), index * 100);
                    });
                    
                    toast({
                      title: "Panier vidé",
                      description: `${totalItems} article${totalItems > 1 ? 's' : ''} retiré${totalItems > 1 ? 's' : ''}`,
                    });
                  }
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Vider
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
      </div>

      {cartItems.length === 0 ? (
        <CartEmptyState onClose={onClose} />
      ) : (
        <div className="flex flex-col h-[calc(100dvh-140px)]">
          {/* Items grouped by vendor */}
          <ScrollArea className="flex-1 px-3 sm:px-4">
            <div className="space-y-4 py-3">
              {Object.values(vendorGroups).map((group) => (
                <div key={group.sellerId}>
                  <div className="flex items-center justify-between px-1 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-muted/50 rounded-lg">
                        <Store className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium truncate">{group.sellerName}</span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {group.total.toLocaleString()} CDF
                    </span>
                  </div>
                  <div className="divide-y divide-border/20">
                    <AnimatePresence mode="popLayout">
                      {group.items.map((item, index) => (
                        <AnimatedCartItem
                          key={item.id}
                          item={item}
                          index={index}
                          onUpdateQuantity={(id, qty) => onUpdateQuantity(id, qty)}
                          onRemove={(id, name) => onRemoveItem(id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Footer épuré avec wallet et action */}
          <div className="sticky bottom-0 border-t bg-background p-3 sm:p-4 space-y-3 z-50">
            {/* Section TembeaPay */}
            <div className="rounded-2xl bg-muted/30 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">TembeaPay</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {wallet?.balance?.toLocaleString() || 0} CDF
                  </span>
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      isSufficientBalance 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}
                  >
                    {isSufficientBalance ? "OK" : "Insuffisant"}
                  </Badge>
                </div>
              </div>
              
              {!isSufficientBalance && (
                <Button
                  variant="outline"
                  onClick={() => setShowTopUpModal(true)}
                  className="w-full border-primary text-primary hover:bg-primary/5"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Recharger {amountNeeded.toLocaleString()} CDF
                </Button>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center px-1 pt-1 border-t border-border/30">
              <span className="text-base font-medium">Total</span>
              <span className="text-xl font-bold text-foreground tabular-nums">
                {totalPrice.toLocaleString()} CDF
              </span>
            </div>

            {/* Bouton Continuer */}
            <Button 
              data-checkout-button
              className="w-full h-13 rounded-2xl font-bold text-base min-h-[52px] touch-manipulation"
              onClick={handleProceedToDelivery}
              disabled={!isSufficientBalance}
            >
              <ChevronRight className="w-5 h-5 mr-2" />
              Continuer
            </Button>
            
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              Paiement sécurisé • {vendorCount} commande{vendorCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </>
  );

  // Vue de livraison - NOUVELLE
  const renderDeliveryView = () => (
    <>
      {/* Header livraison */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-purple-600 to-pink-600 p-4 sm:p-6">
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        
        <SheetHeader className="relative z-10">
          <SheetTitle className="flex items-center gap-3 text-white">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCheckoutStep('cart')}
              className="text-white hover:bg-white/20 -ml-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold">Livraison</span>
              <span className="text-sm text-white/90 font-normal">
                Où souhaitez-vous être livré ?
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>
      </div>

      <div className="flex flex-col h-[calc(100dvh-140px)]">
        <ScrollArea className="flex-1 px-3 sm:px-4">
          <div className="space-y-4 py-4">
            {/* Adresse de livraison */}
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress" className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Adresse de livraison *
              </Label>
              <Input
                id="deliveryAddress"
                placeholder="Ex: Avenue de la Paix N°123, Gombe, Kinshasa"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className={cn(
                  "min-h-[48px]",
                  deliveryErrors.address && "border-destructive"
                )}
              />
              {deliveryErrors.address && (
                <p className="text-xs text-destructive">{deliveryErrors.address}</p>
              )}
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="buyerPhone" className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-primary" />
                Numéro de téléphone *
              </Label>
              <Input
                id="buyerPhone"
                type="tel"
                placeholder="Ex: +243 XXX XXX XXX"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                className={cn(
                  "min-h-[48px]",
                  deliveryErrors.phone && "border-destructive"
                )}
              />
              {deliveryErrors.phone && (
                <p className="text-xs text-destructive">{deliveryErrors.phone}</p>
              )}
            </div>

            {/* Récapitulatif */}
            <Card className="bg-muted/30 border-border/40">
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold text-sm">Récapitulatif</h4>
                <div className="flex justify-between text-sm">
                  <span>{totalItems} article{totalItems > 1 ? 's' : ''}</span>
                  <span className="font-medium">{totalPrice.toLocaleString()} CDF</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Frais de livraison</span>
                  <span>Proposés par le vendeur</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-background/98 backdrop-blur-md shadow-2xl p-3 sm:p-4 space-y-3 z-50">
          <div className="flex justify-between items-center px-1">
            <span className="text-base sm:text-lg font-semibold">Total</span>
            <span className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
              {totalPrice.toLocaleString()} CDF
            </span>
          </div>

          <Button 
            className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold bg-primary min-h-[44px] touch-manipulation active:scale-[0.98] transition-transform"
            onClick={handleConfirmDelivery}
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Payer avec TembeaPay
          </Button>

          <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
            💰 Solde: {wallet?.balance?.toLocaleString() || 0} CDF
          </p>
        </div>
      </div>
    </>
  );

  const renderProcessingView = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 p-6 sm:p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary/30 border-t-primary rounded-full"
      />
      <div className="space-y-2">
        <h3 className="text-base sm:text-lg font-semibold">Traitement en cours</h3>
        <p className="text-sm sm:text-base text-muted-foreground">Création de {vendorCount} commande{vendorCount > 1 ? 's' : ''}...</p>
        <p className="text-xs sm:text-sm text-muted-foreground">Paiement sécurisé par TembeaPay</p>
        <p className="text-xs text-muted-foreground/70">Ne fermez pas cette fenêtre</p>
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const renderSuccessView = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 p-6 sm:p-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
      >
        <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
      </motion.div>
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-bold text-green-600">Paiement Réussi !</h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          {vendorCount} commande{vendorCount > 1 ? 's' : ''} créée{vendorCount > 1 ? 's' : ''}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Total payé : {totalPrice.toLocaleString()} CDF
        </p>
      </div>
    </div>
  );

  // Confirmation avant fermeture si panier non-vide
  const handleCloseAttempt = (open: boolean) => {
    if (!open && cartItems.length > 0 && checkoutStep === 'cart') {
      const confirmed = confirm(
        `⚠️ Vous avez ${totalItems} article${totalItems > 1 ? 's' : ''} dans votre panier !\n\n` +
        `💰 Total : ${totalPrice.toLocaleString()} CDF\n\n` +
        `Voulez-vous vraiment quitter sans finaliser votre commande ?`
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleCloseAttempt}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 overflow-hidden">
          {checkoutStep === 'cart' && renderCartView()}
          {checkoutStep === 'delivery' && renderDeliveryView()}
          {checkoutStep === 'processing' && renderProcessingView()}
          {checkoutStep === 'success' && renderSuccessView()}
        </SheetContent>
      </Sheet>

      <KwendaPayCheckout
        isOpen={showPaymentDialog}
        total={totalPrice}
        walletBalance={wallet?.balance || 0}
        onConfirm={handleConfirmPayment}
        onCancel={() => setShowPaymentDialog(false)}
      />

      <SuccessConfetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Modal de rechargement wallet */}
      <UnifiedTopUpModal
        open={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        userType="client"
        walletBalance={wallet?.balance || 0}
        currency="CDF"
        onSuccess={() => {
          setShowTopUpModal(false);
        }}
      />
    </>
  );
};
