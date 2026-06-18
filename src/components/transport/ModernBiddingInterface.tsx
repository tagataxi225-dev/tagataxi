import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, TrendingDown, TrendingUp, Info, Plus, Minus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModernBiddingInterfaceProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  basePrice: number;
  proposedPrice: number | null;
  onProposedPriceChange: (price: number) => void;
  driversNotified?: number;
  offersReceived?: number;
}

export default function ModernBiddingInterface({
  enabled,
  onEnabledChange,
  basePrice,
  proposedPrice,
  onProposedPriceChange,
  driversNotified = 0,
  offersReceived = 0
}: ModernBiddingInterfaceProps) {
  const currentPrice = proposedPrice ?? basePrice;
  const minPrice = Math.round(basePrice * 0.6);
  const maxPrice = Math.round(basePrice * 1.3);
  
  const savings = basePrice - currentPrice;
  const savingsPercent = Math.round((savings / basePrice) * 100);
  const isDiscount = savings > 0;

  const presets = [
    { label: '-10%', value: Math.round(basePrice * 0.9) },
    { label: '-20%', value: Math.round(basePrice * 0.8) },
    { label: '-30%', value: Math.round(basePrice * 0.7) },
    { label: 'TAGA', value: basePrice }
  ];

  const handleIncrement = () => {
    onProposedPriceChange(Math.min(maxPrice, currentPrice + 500));
  };

  const handleDecrement = () => {
    onProposedPriceChange(Math.max(minPrice, currentPrice - 500));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-300",
        enabled
          ? "bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30"
          : "bg-muted/20 border border-border/30"
      )}
    >
      {/* Header compact */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
            enabled 
              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" 
              : "bg-muted text-muted-foreground"
          )}>
            <Gavel className="w-4 h-4" />
          </div>
          
          <div>
            <p className={cn(
              "font-semibold text-sm transition-colors",
              enabled ? "text-amber-700 dark:text-amber-400" : "text-foreground"
            )}>
              Négociez le prix
            </p>
            <p className="text-[11px] text-muted-foreground">
              {enabled ? "Proposez votre offre" : "Activez pour proposer"}
            </p>
          </div>
        </div>

        <Switch
          checked={enabled}
          onCheckedChange={(checked) => {
            onEnabledChange(checked);
            if (checked && !proposedPrice) {
              onProposedPriceChange(basePrice);
            }
          }}
          className="data-[state=checked]:bg-amber-500"
        />
      </div>

      {/* Contenu bidding - Soft et compact */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 pb-4 space-y-4">
              {/* Zone prix avec boutons +/- */}
              <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4">
                <p className="text-[11px] text-muted-foreground text-center mb-3">Votre offre</p>
                
                {/* Boutons +/- et prix central */}
                <div className="flex items-center justify-center gap-4">
                  {/* Bouton - */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDecrement}
                    disabled={currentPrice <= minPrice}
                    className="w-12 h-12 rounded-full bg-muted/60 hover:bg-muted border border-border/30 transition-all disabled:opacity-40"
                  >
                    <Minus className="h-5 w-5 text-foreground" />
                  </Button>

                  {/* Prix central */}
                  <div className="min-w-[120px] text-center">
                    <motion.p 
                      key={currentPrice}
                      initial={{ scale: 0.9, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums"
                    >
                      {currentPrice.toLocaleString()}
                      <span className="text-sm font-medium ml-1 text-muted-foreground">CDF</span>
                    </motion.p>
                  </div>

                  {/* Bouton + */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleIncrement}
                    disabled={currentPrice >= maxPrice}
                    className="w-12 h-12 rounded-full bg-muted/60 hover:bg-muted border border-border/30 transition-all disabled:opacity-40"
                  >
                    <Plus className="h-5 w-5 text-foreground" />
                  </Button>
                </div>
                
                {/* Indicateur économie - Discret */}
                {savings !== 0 && (
                  <div className="flex justify-center mt-3">
                    <div className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium",
                      isDiscount
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {isDiscount ? (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          -{Math.abs(savingsPercent)}% par rapport au prix TAGA
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          +{Math.abs(savingsPercent)}% (offre généreuse)
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Presets rapides */}
              <div className="flex justify-center gap-2 flex-wrap">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => onProposedPriceChange(preset.value)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-medium transition-all h-auto",
                      currentPrice === preset.value
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Tip discret */}
              <div className="flex items-start gap-1.5 px-2 py-1.5 bg-amber-100/30 dark:bg-amber-900/10 rounded-lg">
                <Info className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-300">
                  Plus votre offre est attractive, plus vite vous serez pris en charge
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}