import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  Check, 
  X, 
  Clock, 
  TrendingDown,
  Trophy,
  Loader2,
  Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface DriverOffer {
  offerId: string;
  driverId: string;
  driverName: string;
  driverAvatar?: string;
  driverRating?: number;
  offeredPrice: number;
  isCounterOffer: boolean;
  message?: string;
  distanceToPickup?: number;
  estimatedArrival?: number;
  createdAt: string;
}

interface BiddingOffersLiveProps {
  offers: DriverOffer[];
  clientPrice: number;
  loading?: boolean;
  onAcceptOffer: (offerId: string, driverId: string) => void;
  onRejectOffer: (offerId: string) => void;
  timeRemaining: number;
}

export default function BiddingOffersLive({
  offers,
  clientPrice,
  loading = false,
  onAcceptOffer,
  onRejectOffer,
  timeRemaining
}: BiddingOffersLiveProps) {
  // Trier par meilleur prix
  const sortedOffers = [...offers].sort((a, b) => a.offeredPrice - b.offeredPrice);
  const bestOffer = sortedOffers[0];

  // Formater le temps restant
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timeRemaining / 300) * 100;

  if (offers.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl p-6 border border-border/50"
      >
        {/* Timer en haut */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Temps restant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-mono font-bold",
              timeRemaining < 60 ? "text-red-500" : "text-foreground"
            )}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-6">
          <motion.div 
            className={cn(
              "h-full rounded-full",
              timeRemaining < 60 
                ? "bg-red-500" 
                : timeRemaining < 120 
                ? "bg-amber-500" 
                : "bg-primary"
            )}
            initial={{ width: '100%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* État d'attente */}
        <div className="text-center py-8">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center"
          >
            <Car className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </motion.div>
          
          <h3 className="font-bold text-lg text-foreground mb-2">
            En attente des chauffeurs...
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Les chauffeurs proches de vous reçoivent votre demande. Patientez quelques instants.
          </p>

          {loading && (
            <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Envoi aux chauffeurs...</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-4 border border-emerald-200/50 dark:border-emerald-800/50"
    >
      {/* Header avec compteur */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground">{offers.length} offre{offers.length > 1 ? 's' : ''} reçue{offers.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-muted-foreground">Temps restant: {formatTime(timeRemaining)}</p>
          </div>
        </div>
        
        <Badge className="bg-emerald-500 text-white border-0">
          <TrendingDown className="w-3 h-3 mr-1" />
          Actif
        </Badge>
      </div>

      {/* Progress bar mini */}
      <div className="h-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden mb-4">
        <motion.div 
          className="h-full bg-emerald-500 rounded-full"
          animate={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Liste des offres */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        <AnimatePresence>
          {sortedOffers.map((offer, index) => {
            const isBest = offer.offerId === bestOffer?.offerId;
            const priceDiff = offer.offeredPrice - clientPrice;
            const isLower = priceDiff <= 0;

            return (
              <motion.div
                key={offer.offerId}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative p-4 rounded-xl transition-all duration-300",
                  isBest
                    ? "bg-white dark:bg-black/30 shadow-lg border-2 border-emerald-400 dark:border-emerald-600"
                    : "bg-white/60 dark:bg-black/20 border border-border/50"
                )}
              >
                {/* Badge meilleure offre */}
                {isBest && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 left-4"
                  >
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-2 py-0.5 font-bold shadow-lg border-0">
                      <Trophy className="w-3 h-3 mr-1" />
                      Meilleure offre
                    </Badge>
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  {/* Info chauffeur */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-background shadow-md">
                      <AvatarImage src={offer.driverAvatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {offer.driverName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="font-bold text-foreground">{offer.driverName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {offer.driverRating && (
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {offer.driverRating.toFixed(1)}
                          </span>
                        )}
                        {offer.distanceToPickup && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {offer.distanceToPickup.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prix et actions */}
                  <div className="text-right">
                    <p className={cn(
                      "text-xl font-black",
                      isLower ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                    )}>
                      {offer.offeredPrice.toLocaleString()}
                      <span className="text-xs font-normal ml-1">CDF</span>
                    </p>
                    
                    {priceDiff !== 0 && (
                      <p className={cn(
                        "text-xs font-medium",
                        isLower ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {isLower ? '−' : '+'}{Math.abs(priceDiff).toLocaleString()} vs votre offre
                      </p>
                    )}
                  </div>
                </div>

                {/* Message du chauffeur */}
                {offer.message && (
                  <p className="mt-2 text-sm text-muted-foreground italic bg-muted/30 px-3 py-2 rounded-lg">
                    "{offer.message}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRejectOffer(offer.offerId)}
                    className="flex-1 h-10 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Refuser
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => onAcceptOffer(offer.offerId, offer.driverId)}
                    className={cn(
                      "flex-1 h-10 font-bold",
                      isBest
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accepter
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
