import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getCurrencyByCity, type Currency } from '@/utils/formatCurrency';
import type { FoodCartItem } from '@/types/food';

interface RestaurantCheckoutBarProps {
  cart: FoodCartItem[];
  restaurantName: string;
  onCheckout: () => void;
  onUpdateCart: (productId: string, quantity: number) => void;
  currency?: Currency;
}

export const RestaurantCheckoutBar: React.FC<RestaurantCheckoutBarProps> = ({
  cart,
  restaurantName,
  onCheckout,
  onUpdateCart,
  currency = 'CDF',
}) => {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[88px] md:bottom-6 left-0 right-0 z-30 px-4"
        >
          <div className="max-w-2xl mx-auto">
            <motion.div
              className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-xl p-3 text-white relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animated shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
              />

              <div className="flex items-center justify-between gap-2 relative z-10">
                {/* Left: Cart Info with Badge */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <ShoppingCart className="w-6 h-6" />
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-white text-orange-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                    >
                      {totalItems}
                    </motion.div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{restaurantName}</span>
                      {totalItems >= 5 && (
                        <Badge className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0.5">
                          Prêt
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-white/90">
                      {totalItems} article{totalItems > 1 ? 's' : ''} • {formatCurrency(totalAmount, currency)}
                    </div>
                  </div>
                </div>

                {/* Right: Checkout Button */}
                <Button
                  onClick={onCheckout}
                  size="default"
                  className="bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-lg text-sm px-4 py-2"
                >
                  Commander
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
