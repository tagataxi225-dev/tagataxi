import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { secureLog } from '@/utils/secureLogger';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag } from 'lucide-react';
import { AnimatedCartItem } from './AnimatedCartItem';
import { AnimatedCartTotal } from './AnimatedCartTotal';
import { CartEmptyState } from './CartEmptyState';
import { CartCheckoutButton } from './CartCheckoutButton';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { FloatingParticles } from '@/components/wallet/FloatingParticles';
import { KwendaPayCheckout } from './KwendaPayCheckout';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  seller: string;
  seller_id: string;
  coordinates?: { lat: number; lng: number };
}

interface ModernShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout?: () => void;
}

export const ModernShoppingCart: React.FC<ModernShoppingCartProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [deletedItem, setDeletedItem] = useState<{ id: string; name: string } | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { wallet } = useWallet();
  const { toast } = useToast();

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveItem = (id: string, name: string) => {
    setDeletedItem({ id, name });
    onRemoveItem(id);

    // Auto-clear undo after 5s
    setTimeout(() => {
      setDeletedItem(null);
    }, 5000);
  };

  const handleCheckout = async () => {
    secureLog.log('🛒 [Checkout] Opening payment dialog');
    
    // Forcer fermeture puis réouverture pour éviter cache
    setShowPaymentDialog(false);
    setTimeout(() => {
      setShowPaymentDialog(true);
    }, 50);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    let transaction = null;
    
    secureLog.log('💳 [Payment] Starting payment process');
    
    try {
      if (!wallet || wallet.balance < totalPrice) {
        toast({
          title: "Solde insuffisant",
          description: "Votre solde TembeaPay est insuffisant pour cette commande.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      // Call secure edge function for atomic payment processing
      const { data, error } = await supabase.functions.invoke('process-marketplace-payment', {
        body: {
          cartItems: cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price_at_purchase: item.price,
            vendor_id: item.seller_id
          })),
          totalPrice,
          deliveryAddress: 'À définir par le client',
          phoneNumber: user.phone || ''
        }
      });

      if (error) {
        secureLog.error('❌ [Payment] Edge function error', error);
        if (error.message?.includes('Solde insuffisant') || error.message?.includes('Insufficient balance')) {
          toast({
            title: "Solde insuffisant",
            description: "Votre solde TembeaPay est insuffisant pour cette commande.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        setIsProcessing(false);
        return;
      }

      secureLog.log('✅ [Payment] Transaction completed successfully');

      // Créer les commandes marketplace par vendeur
      const vendorGroups = cartItems.reduce((groups, item) => {
        if (!groups[item.seller_id]) {
          groups[item.seller_id] = [];
        }
        groups[item.seller_id].push(item);
        return groups;
      }, {} as Record<string, CartItem[]>);

      const orderPromises = Object.entries(vendorGroups).map(async ([sellerId, items]) => {
        for (const item of items) {
          await supabase.from('marketplace_orders').insert({
            buyer_id: user.id,
            seller_id: sellerId,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_amount: item.price * item.quantity,
            delivery_method: 'pickup',
            payment_status: 'paid',
            status: 'pending_confirmation',
            notes: `Payé via TembeaPay - Transaction ${transaction.id}`,
          });
        }
      });

      setShowConfetti(true);
      setShowPaymentDialog(false);
      
      toast({
        title: "✅ Paiement réussi",
        description: `${totalPrice.toLocaleString()} CDF débités - Commandes créées`,
      });

      if (onCheckout) {
        setTimeout(() => {
          onCheckout();
          setShowConfetti(false);
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      secureLog.error('❌ [Payment] Error:', error);
      
      let errorMessage = "Une erreur est survenue lors du paiement";
      
      if (error.message?.includes('wallet_transactions')) {
        errorMessage = "Erreur lors de l'enregistrement de la transaction";
      } else if (error.message?.includes('user_wallets')) {
        errorMessage = "Erreur lors de la mise à jour du solde";
      } else if (error.message?.includes('marketplace_orders')) {
        errorMessage = "Erreur lors de la création de la commande";
      } else if (error.code === '23503') {
        errorMessage = "Erreur de référence de données (clé étrangère)";
      }
      
      toast({
        title: "❌ Erreur de paiement",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Rollback si transaction créée mais échec ensuite
      if (transaction?.id) {
        await supabase.from('wallet_transactions').delete().eq('id', transaction.id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 overflow-hidden">
          {/* Modern gradient header with glassmorphism */}
          <div className="relative overflow-hidden">
            <FloatingParticles />
            <div className="relative bg-gradient-to-br from-primary via-primary/80 to-secondary p-4 sm:p-6 backdrop-blur-xl">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-white">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <ShoppingBag className="w-6 h-6" />
                  </motion.div>
                  <div className="flex flex-col gap-1">
                    <span className="text-lg sm:text-xl font-bold">Mon Panier</span>
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-sm font-normal text-white/80"
                    >
                      {totalItems} {totalItems > 1 ? 'articles' : 'article'}
                    </motion.span>
                  </div>
                </SheetTitle>
              </SheetHeader>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <CartEmptyState onClose={onClose} />
          ) : (
            <div className="flex flex-col h-[calc(100dvh-140px)]">
              {/* Cart items with scroll */}
              <ScrollArea className="flex-1 px-4">
                <motion.div 
                  className="space-y-3 py-4"
                  layout
                >
                  <AnimatePresence mode="popLayout">
                    {cartItems.map((item, index) => (
                      <AnimatedCartItem
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </ScrollArea>

              {/* Footer with total and checkout */}
              <div className="border-t bg-background/95 backdrop-blur-sm p-3 sm:p-4 space-y-3 sm:space-y-4">
                <AnimatedCartTotal total={totalPrice} />
                
                <CartCheckoutButton
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  isProcessing={isProcessing}
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continuer les achats
                </motion.button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      
      <KwendaPayCheckout
        key={`${totalPrice}-${wallet?.balance || 0}`}
        isOpen={showPaymentDialog}
        total={totalPrice}
        walletBalance={wallet?.balance || 0}
        onConfirm={handleConfirmPayment}
        onCancel={() => setShowPaymentDialog(false)}
      />

      <SuccessConfetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
    </>
  );
};
