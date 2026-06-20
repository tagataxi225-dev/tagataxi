import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, AlertCircle, CheckCircle2, Loader2, MapPin, UtensilsCrossed, ArrowLeft, Plus, Clock, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TopUpModal } from '@/components/wallet/TopUpModal';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, getCurrencyByCity } from '@/utils/formatCurrency';
import type { Restaurant, FoodCartItem } from '@/types/food';
import type { LocationData } from '@/hooks/useSmartGeolocation';
import { motion } from 'framer-motion';

interface FoodCheckoutProps {
  cart: FoodCartItem[];
  restaurant: Restaurant;
  subtotal: number;
  serviceFee: number;
  total: number;
  onPlaceOrder: (deliveryAddress: string, paymentMethod: 'kwenda_pay' | 'cash', coordinates?: { lat: number; lng: number }) => void;
  onBack: () => void;
}

export const FoodCheckout = ({
  cart,
  restaurant,
  subtotal,
  serviceFee,
  total,
  onPlaceOrder,
  onBack,
}: FoodCheckoutProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { wallet } = useWallet();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<LocationData | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  const city = restaurant.address || '';
  const currency = getCurrencyByCity(city);


  const minimumOrder = restaurant.minimum_order_amount || 0;
  const isUnderMinimum = subtotal < minimumOrder;
  const missingAmount = minimumOrder - subtotal;
  
  const walletBalance = (wallet?.balance || 0) + (wallet?.bonus_balance || 0);
  const hasInsufficientFunds = walletBalance < total;
  const missingFunds = total - walletBalance;
  const hasValidDeliveryLocation = !!deliveryAddress.trim()
    && !!deliveryLocation?.lat && !!deliveryLocation?.lng;
  const canPlaceOrder = hasValidDeliveryLocation && !isUnderMinimum && !hasInsufficientFunds;

  const formatPrice = (price: number) => {
    return formatCurrency(price, currency);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleConfirmOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast({
        title: 'Adresse requise',
        description: 'Veuillez entrer votre adresse de livraison',
        variant: 'destructive'
      });
      return;
    }

    if (isUnderMinimum) {
      toast({
        title: 'Commande minimale non atteinte',
        description: `Ajoutez encore ${formatPrice(missingAmount)} pour commander`,
        variant: 'destructive'
      });
      return;
    }

    if (hasInsufficientFunds) {
      toast({
        title: 'Solde insuffisant',
        description: 'Veuillez recharger votre compte TAGAPay',
        variant: 'destructive'
      });
      return;
    }

    if (!deliveryLocation?.lat || !deliveryLocation?.lng) {
      toast({
        title: 'Localisation requise',
        description: 'Choisissez une adresse dans les suggestions, ou appuyez sur le bouton position GPS.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onPlaceOrder(deliveryAddress, 'kwenda_pay', deliveryLocation ? { lat: deliveryLocation.lat, lng: deliveryLocation.lng } : undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4 max-w-2xl mx-auto"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)' }}
    >
      {/* Restaurant Header — Logo + Infos */}
      <div className="bg-card rounded-2xl p-4 border border-border/40 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <Avatar className="h-14 w-14 rounded-xl border-2 border-primary/20 shadow-md flex-shrink-0">
            <AvatarImage src={restaurant.logo_url || undefined} alt={restaurant.restaurant_name} className="object-cover" />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
              {getInitials(restaurant.restaurant_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground truncate text-base">{restaurant.restaurant_name}</h3>
            {restaurant.address && restaurant.address.trim().toLowerCase() !== restaurant.restaurant_name.trim().toLowerCase() && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{restaurant.address}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              {restaurant.average_preparation_time && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  <Clock className="h-3 w-3" />
                  ~{restaurant.average_preparation_time} min
                </span>
              )}
              {restaurant.rating_average && restaurant.rating_average > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {restaurant.rating_average.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Total Highlight */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total (hors livraison)</p>
          <p className="text-xl font-bold text-primary">{formatPrice(total)}</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
          {totalItems} article{totalItems > 1 ? 's' : ''}
        </span>
      </div>

      {/* Order Summary */}
      <div className="bg-card rounded-2xl p-4 border border-border/40">
        <h3 className="font-semibold text-foreground text-sm mb-3">Votre commande</h3>
        
        <div className="space-y-2.5">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {/* Item thumbnail */}
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {item.main_image_url ? (
                  <img src={item.main_image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
              </div>
              <span className="text-sm font-medium text-foreground whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="h-px bg-border/50 my-3" />

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="text-foreground">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Frais de service</span>
            <span className="text-foreground">{formatPrice(serviceFee)}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold pt-2 border-t border-border/30">
            <span className="text-foreground">Total (hors livraison)</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            🚴 Frais de livraison confirmés par le restaurant après validation
          </p>
        </div>
      </div>

      {/* Minimum Order Warning */}
      {isUnderMinimum && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Commande minimale : {formatPrice(minimumOrder)}. 
            Ajoutez {formatPrice(missingAmount)} de produits.
          </AlertDescription>
        </Alert>
      )}

      {/* Delivery Address */}
      <div className="bg-card rounded-2xl p-4 border border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Adresse de livraison <span className="text-destructive">*</span></h3>
        </div>
        
        <AddressAutocompleteInput
          value={deliveryAddress}
          onChange={(address, location) => {
            setDeliveryAddress(address);
            setDeliveryLocation(location || null);
          }}
          required
        />
        {deliveryAddress.trim() && !deliveryLocation && (
          <p className="text-xs text-warning text-center mt-2">
            ⚠️ Sélectionnez une adresse dans les suggestions pour la livraison GPS
          </p>
        )}
        
        <Textarea
          placeholder="Instructions de livraison (optionnel)"
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
          rows={2}
          className="mt-3 rounded-xl border-border/50 bg-background resize-none"
        />
      </div>

      {/* Payment - TAGAPay Only */}
      <div className="bg-card rounded-2xl p-4 border border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Paiement</h3>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">TAGAPay</p>
              <p className="text-xs text-muted-foreground">Solde: {formatPrice(walletBalance)}</p>
            </div>
          </div>
          {!hasInsufficientFunds && (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          )}
        </div>

        {hasInsufficientFunds && (
          <motion.div 
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-destructive/10 rounded-xl space-y-2.5"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-xs text-destructive">
                Solde insuffisant. Il vous manque <span className="font-semibold">{formatPrice(missingFunds)}</span>.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTopUpModal(true)}
              className="w-full h-9 rounded-lg border-primary/30 text-primary hover:bg-primary/5 font-medium text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Recharger maintenant
            </Button>
          </motion.div>
        )}
      </div>

      {/* Action Buttons - Fixed Bottom */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border/40 z-40"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
      >
        <div className="flex gap-3 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-14 rounded-2xl px-4"
            disabled={isProcessing}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleConfirmOrder}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-bold text-base shadow-xl shadow-primary/20"
              disabled={!canPlaceOrder || isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Traitement...
                </span>
              ) : (
                `Commander • ${formatPrice(total)}`
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* TopUp Modal intégré */}
      <TopUpModal
        open={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={() => setShowTopUpModal(false)}
        currency={currency}
      />
    </motion.div>
  );
};
