import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatCurrency';
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface FloatingCartIndicatorProps {
  cartItems: CartItem[];
  onOpenCart: () => void;
  className?: string;
}

export const FloatingCartIndicator = ({
  cartItems,
  onOpenCart,
  className
}: FloatingCartIndicatorProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [recentAddition, setRecentAddition] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Détecter les ajouts au panier
  useEffect(() => {
    if (cartCount > 0) {
      setRecentAddition(true);
      setTimeout(() => setRecentAddition(false), 1000);
    }
  }, [cartCount]);
  
  // Afficher seulement les 3 derniers articles ajoutés
  const recentItems = cartItems.slice(-3).reverse();

  const formatPrice = (price: number) => formatCurrency(price, 'CDF');

  if (cartCount === 0) return null;

  return (
    <>
      {/* Floating Cart Button */}
      <motion.div
        className={cn(
          'fixed bottom-20 right-4 z-50',
          className
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            data-cart-button
            size="lg"
            onClick={onOpenCart}
            className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white shadow-2xl hover:shadow-primary/50 transition-all"
          >
            <ShoppingCart className="h-7 w-7" />
            
            {/* Badge quantité animé - Plus grand et plus visible */}
            <AnimatePresence mode="wait">
              {cartCount > 0 && (
                <motion.div
                  key={cartCount}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={recentAddition ? {
                    scale: [1, 1.6, 1],
                    rotate: [0, 15, -15, 0]
                  } : { scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={recentAddition ? { duration: 0.6, ease: "easeInOut" } : { type: 'spring', stiffness: 300 }}
                  className={cn(
                    "absolute -top-2 -right-2 bg-destructive text-white rounded-full flex items-center justify-center font-bold shadow-lg ring-2 ring-background",
                    cartCount > 9 ? "min-w-8 h-8 text-sm px-1.5" : "w-8 h-8 text-base",
                    recentAddition && "animate-bounce"
                  )}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        {/* Mini preview on hover (desktop only) */}
        <AnimatePresence>
          {isHovered && recentItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 right-full mr-4 hidden lg:block"
            >
              <Card className="w-72 shadow-2xl border-2 border-primary/20 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-orange-500 p-3">
                  <div className="flex items-center justify-between text-white">
                    <span className="font-semibold">Panier ({cartCount})</span>
                    <span className="text-sm">{formatPrice(cartTotal)}</span>
                  </div>
                </div>
                
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                  {recentItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Qté: {item.quantity}</span>
                          <span>•</span>
                          <span className="font-semibold text-primary">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {cartItems.length > 3 && (
                    <p className="text-xs text-center text-muted-foreground pt-2 border-t">
                      +{cartItems.length - 3} autre{cartItems.length - 3 > 1 ? 's' : ''} article{cartItems.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="border-t p-3 bg-muted/30">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={onOpenCart}
                  >
                    Voir mon panier
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </>
  );
};
