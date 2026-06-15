import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2, ShoppingCart, ArrowRight, Store } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import type { Restaurant, FoodCartItem } from '@/types/food';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';

interface FoodCartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: FoodCartItem[];
  restaurant: Restaurant;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}

export const FoodCart = ({
  open,
  onOpenChange,
  cart,
  restaurant,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: FoodCartProps) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const serviceFee = subtotal * 0.05;
  const total = subtotal + serviceFee;
  const canCheckout = subtotal >= (restaurant.minimum_order_amount || 0);
  const currency = getCurrencyByCity(restaurant.city || '');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number) => {
    return formatCurrency(price, currency);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex flex-col p-0 rounded-t-3xl"
        style={{
          height: '85dvh',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))',
        }}
      >
        {/* Header */}
        <SheetHeader className="px-4 sm:px-5 pt-4 pb-3 flex-shrink-0">
          <SheetTitle className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Avatar className="h-11 w-11 rounded-xl shadow-md">
                <AvatarImage src={restaurant.logo_url || ''} alt={restaurant.restaurant_name} className="rounded-xl object-cover" />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold text-sm">
                  {restaurant.restaurant_name?.slice(0, 2).toUpperCase() || <Store className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-background">
                  {totalItems}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-base font-bold truncate text-foreground">{restaurant.restaurant_name}</span>
              <span className="block text-xs text-muted-foreground">
                {totalItems} article{totalItems > 1 ? 's' : ''} • {formatPrice(subtotal)}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable items */}
        <ScrollArea className="flex-1 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Panier vide</h3>
              <p className="text-muted-foreground text-center text-sm mb-5">
                Ajoutez des plats pour commencer
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                Parcourir le menu
              </Button>
            </div>
          ) : (
            <div className="px-3 sm:px-4 pb-4 space-y-2">
              <AnimatePresence initial={false}>
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2.5 sm:gap-3 bg-card border border-border/50 rounded-2xl p-2.5 sm:p-3"
                  >
                    {/* Image */}
                    {item.main_image_url && (
                      <img
                        src={item.main_image_url}
                        alt={item.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    )}

                    {/* Info + controls */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{item.name}</h4>
                        <p className="font-bold text-sm text-foreground whitespace-nowrap flex-shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                      <p className="text-xs text-primary font-bold mt-0.5">
                        {formatPrice(item.price)} / unité
                      </p>

                      {/* Quantity pill */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="flex items-center bg-muted rounded-full">
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted-foreground/10 transition-colors"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <span className="font-bold text-sm w-6 text-center text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted-foreground/10 transition-colors"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded-full text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                          onClick={() => onRemove(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer — glassmorphism + safe area */}
        {cart.length > 0 && (
          <div
            className="flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-xl"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
            }}
          >
            <div className="px-5 pt-3 pb-2 space-y-2">
              {/* Pricing summary — compact */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frais de service (5%)</span>
                  <span className="font-medium text-foreground">{formatPrice(serviceFee)}</span>
                </div>
                <div className="h-px bg-border/50 my-1" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Total (hors livraison)</span>
                  <span className="font-bold text-lg text-primary">{formatPrice(total)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  🚴 Frais de livraison confirmés par le restaurant après validation
                </p>
              </div>

              {/* Min order warning */}
              {!canCheckout && restaurant.minimum_order_amount && (
                <p className="text-xs text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                  Min. {formatPrice(restaurant.minimum_order_amount)} — encore {formatPrice(restaurant.minimum_order_amount - subtotal)}
                </p>
              )}

              {/* CTA */}
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 transition-all duration-200 hover:shadow-2xl hover:shadow-orange-500/30"
                  disabled={!canCheckout}
                  onClick={onCheckout}
                >
                  <span>Commander</span>
                  <span className="mx-2">•</span>
                  <span>{formatPrice(total)}</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
