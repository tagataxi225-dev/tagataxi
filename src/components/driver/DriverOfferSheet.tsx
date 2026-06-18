import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useDriverSubscriptions } from '@/hooks/useDriverSubscriptions';
import { Badge } from '@/components/ui/badge';
import { useDriverOffer } from '@/hooks/useDriverOffer';
import { MapPin, Users, TrendingDown, TrendingUp, Zap, Minus, Plus } from 'lucide-react';

interface DriverOfferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  estimatedPrice: number;
  distance: number;
  pickupAddress: string;
  destinationAddress: string;
  offerCount?: number;
  distanceToPickup?: number;
}

const STEP = 500;

export const DriverOfferSheet = ({
  open,
  onOpenChange,
  bookingId,
  estimatedPrice,
  distance,
  pickupAddress,
  destinationAddress,
  offerCount = 0,
}: DriverOfferSheetProps) => {
  const { submitOffer, submitting } = useDriverOffer();
  const [offeredPrice, setOfferedPrice] = useState(estimatedPrice);

  const minPrice = Math.floor(estimatedPrice * 0.5);
  const maxPrice = Math.ceil(estimatedPrice * 1.5);

  const { currentSubscription } = useDriverSubscriptions();
  const commissionRate = (() => {
    if (!currentSubscription) return 0.15;
    const name = (currentSubscription.plan_name || '').toLowerCase();
    if (name.includes('pro') || name.includes('premium')) return 0.08;
    if (name.includes('plus')) return 0.10;
    return 0.15;
  })();
  const netEarning = Math.round(offeredPrice * (1 - commissionRate));

  const quickPrices = [
    { label: '-10%', value: Math.floor(estimatedPrice * 0.9), icon: TrendingDown },
    { label: 'TAGA', value: estimatedPrice, icon: Zap },
    { label: '+10%', value: Math.ceil(estimatedPrice * 1.1), icon: TrendingUp },
  ];

  useEffect(() => {
    if (open) setOfferedPrice(estimatedPrice);
  }, [open, estimatedPrice]);

  const handleSubmit = async () => {
    if (offeredPrice < minPrice || offeredPrice > maxPrice) return;
    const success = await submitOffer({
      bookingId,
      offeredPrice,
      originalEstimatedPrice: estimatedPrice,
    });
    if (success) {
      onOpenChange(false);
      setOfferedPrice(estimatedPrice);
    }
  };

  const decrement = () => setOfferedPrice(prev => Math.max(prev - STEP, minPrice));
  const increment = () => setOfferedPrice(prev => Math.min(prev + STEP, maxPrice));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Faire une offre
            </SheetTitle>
            {offerCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10">
                <Users className="h-3 w-3 mr-1" />
                {offerCount} concurrent{offerCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Route summary */}
          <div className="bg-muted/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                <p className="text-sm font-medium truncate">{pickupAddress}</p>
                <p className="text-sm font-medium truncate">{destinationAddress}</p>
              </div>
            </div>
            <div className="flex items-center justify-center mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {distance.toFixed(1)} km
              </span>
            </div>
          </div>

          {/* Quick price presets */}
          <div className="grid grid-cols-3 gap-2">
            {quickPrices.map((preset) => {
              const Icon = preset.icon;
              const isSelected = offeredPrice === preset.value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setOfferedPrice(preset.value)}
                  onTouchEnd={(e) => { e.preventDefault(); setOfferedPrice(preset.value); }}
                  style={{ touchAction: 'manipulation' }}
                  className={`p-3 rounded-xl border-2 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 bg-muted/30'
                  }`}
                >
                  <Icon className={`h-4 w-4 mx-auto mb-1 ${
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <p className={`text-xs font-medium ${isSelected ? 'text-primary' : ''}`}>
                    {preset.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {preset.value.toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>

          {/* +/- price adjuster */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={decrement}
              onTouchEnd={(e) => { e.preventDefault(); decrement(); }}
              disabled={offeredPrice <= minPrice}
              style={{ touchAction: 'manipulation' }}
              className="w-14 h-14 rounded-full bg-muted flex items-center justify-center disabled:opacity-40 border-2 border-border/50"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="relative">
              <div className="w-36 h-16 flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl">
                {offeredPrice.toLocaleString()}
              </div>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                CDF
              </span>
            </div>

            <button
              type="button"
              onClick={increment}
              onTouchEnd={(e) => { e.preventDefault(); increment(); }}
              disabled={offeredPrice >= maxPrice}
              style={{ touchAction: 'manipulation' }}
              className="w-14 h-14 rounded-full bg-muted flex items-center justify-center disabled:opacity-40 border-2 border-border/50"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>



          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            onTouchEnd={(e) => { e.preventDefault(); handleSubmit(); }}
            disabled={submitting || offeredPrice < minPrice || offeredPrice > maxPrice}
            style={{ touchAction: 'manipulation' }}
            className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-lg shadow-amber-500/25 disabled:opacity-50"
          >
            {submitting ? 'Envoi…' : `Envoyer ${offeredPrice.toLocaleString()} CDF`}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
