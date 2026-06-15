import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Minus, Plus, Download, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatCurrency';

interface MobileBottomCTAProps {
  productPrice: number;
  stockCount: number;
  walletBalance: number;
  onAddToCart: (quantity: number) => void;
  onBuyNow: (quantity: number) => void;
  onTopUp: () => void;
  onContactSeller?: () => void;
  isDigital?: boolean;
}

export const MobileBottomCTA: React.FC<MobileBottomCTAProps> = ({
  productPrice,
  stockCount,
  walletBalance,
  onAddToCart,
  onBuyNow,
  onTopUp,
  onContactSeller,
  isDigital = false
}) => {
  const [quantity, setQuantity] = useState(1);

  const formatPrice = (amount: number) => formatCurrency(amount, 'CDF');

  const effectiveQuantity = isDigital ? 1 : quantity;
  const totalPrice = productPrice * effectiveQuantity;
  const canAfford = walletBalance >= totalPrice;

  return (
    <>
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      >
        <div className="bg-background/95 backdrop-blur-lg border-t p-3 space-y-2">
          {/* Main row: [qty] [action button] */}
          <div className="flex items-center gap-2.5">
            {/* Quantity selector — hidden for digital */}
            {!isDigital ? (
              <div className="flex items-center bg-muted rounded-xl overflow-hidden shrink-0">
                <button 
                  className="h-10 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-bold">{quantity}</span>
                <button 
                  className="h-10 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  onClick={() => setQuantity(Math.min(stockCount, quantity + 1))}
                  disabled={quantity >= stockCount}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 text-blue-600 shrink-0">
                <Download className="h-4 w-4" />
                <span className="text-xs font-medium">Digital</span>
              </div>
            )}

            {/* Primary action button — always "Ajouter au panier" */}
            <Button 
              className="flex-1 h-11 gap-2 text-sm font-semibold rounded-xl"
              onClick={() => onAddToCart(effectiveQuantity)}
              disabled={!isDigital && stockCount === 0}
            >
              <ShoppingCart className="h-4 w-4 shrink-0" />
              <span className="truncate">Ajouter</span>
              <span className="opacity-70 font-bold truncate">· {formatPrice(totalPrice)}</span>
            </Button>
          </div>

          {/* Wallet hint — only if can't afford */}
          {!canAfford && (
            <p className="text-[11px] text-center text-muted-foreground">
              Solde insuffisant pour commander.{' '}
              <button 
                onClick={onTopUp}
                className="text-primary font-semibold underline underline-offset-2"
              >
                <Wallet className="h-3 w-3 inline mr-0.5" />
                Recharger
              </button>
            </p>
          )}
        </div>
      </motion.div>

      {/* Spacer */}
      <div className="h-24 lg:hidden" />
    </>
  );
};
