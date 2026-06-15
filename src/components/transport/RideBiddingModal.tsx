import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Star, MapPin, MessageSquare, Crown, Zap, Target, Wallet } from 'lucide-react';
import { useRideBidding } from '@/hooks/useRideBidding';
import { Skeleton } from '@/components/ui/skeleton';

interface RideBiddingModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  estimatedPrice: number;
  clientProposedPrice?: number;
  onOfferAccepted?: (driverId: string) => void;
}

export const RideBiddingModal = ({
  open,
  onClose,
  bookingId,
  estimatedPrice,
  clientProposedPrice,
  onOfferAccepted
}: RideBiddingModalProps) => {
  const {
    offers,
    biddingActive,
    timeRemaining,
    loading,
    bestOffer,
    enableBidding,
    acceptOffer
  } = useRideBidding({ bookingId, estimatedPrice, enabled: true });

  // Activer automatiquement le bidding à l'ouverture
  useEffect(() => {
    if (open && bookingId) {
      enableBidding(clientProposedPrice || Math.floor(estimatedPrice * 0.8));
    }
  }, [open, bookingId, enableBidding, clientProposedPrice, estimatedPrice]);

  // Accepter une offre de chauffeur
  const handleAcceptOffer = async (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    const success = await acceptOffer(offerId);
    if (success) {
      onOfferAccepted?.(offer.driver_id);
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-lg font-bold">Mode enchères</span>
                {clientProposedPrice && (
                  <p className="text-xs font-normal text-muted-foreground/70 mt-0.5">
                    Votre offre : {clientProposedPrice.toLocaleString()} CDF
                  </p>
                )}
              </div>
            </div>
            {biddingActive && (
              <div className="bg-muted/40 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="font-mono text-sm font-medium text-foreground">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Info tarif estimé */}
        <div className="bg-muted/30 border border-border/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground/70">Tarif estimé Tembea</p>
              <p className="text-2xl tracking-tight font-bold text-foreground">
                {estimatedPrice.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">CDF</span>
              </p>
            </div>
            <Zap className="h-5 w-5 text-primary/50" />
          </div>
          
          {/* Statistiques des offres */}
          {offers.length > 0 && (
            <div className="grid grid-cols-3 gap-0 pt-3 border-t border-border/30">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{offers.length}</p>
                <p className="text-xs text-muted-foreground/60">Offres</p>
              </div>
              <div className="text-center border-x border-border/40">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {bestOffer ? bestOffer.offered_price.toLocaleString() : '-'}
                </p>
                <p className="text-xs text-muted-foreground/60">Meilleure</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground/80">
                  {offers.length > 0 
                    ? Math.round(offers.reduce((sum, o) => sum + o.offered_price, 0) / offers.length).toLocaleString()
                    : '-'
                  }
                </p>
                <p className="text-xs text-muted-foreground/60">Moyenne</p>
              </div>
            </div>
          )}
        </div>

        {/* Liste des offres */}
        {biddingActive && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                Offres reçues ({offers.length})
              </h3>
              {offers.length > 0 && (
                <Badge className="bg-primary/10 text-primary border-none rounded-xl text-xs font-medium">
                  Meilleure : {bestOffer?.offered_price.toLocaleString()} CDF
                </Badge>
              )}
            </div>

            {loading && offers.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-muted/20 border border-border/30 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : offers.length === 0 ? (
              <motion.div
                className="bg-muted/20 border border-border/30 rounded-2xl py-10 flex flex-col items-center justify-center"
              >
                <motion.div
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
                </motion.div>
                <p className="text-sm font-medium text-muted-foreground/80">
                  En attente d'offres des chauffeurs...
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  Les chauffeurs à proximité peuvent voir votre demande
                </p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {offers.map((offer, index) => {
                  const isBest = offer.id === bestOffer?.id;
                  const savings = estimatedPrice - offer.offered_price;
                  
                  return (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ 
                        delay: index * 0.08,
                        type: 'spring',
                        stiffness: 300,
                        damping: 25
                      }}
                    >
                      <div className={`rounded-2xl border p-4 relative transition-all hover:shadow-md bg-card ${
                        isBest ? 'border-primary/40 bg-primary/[0.03]' : 'border-border/30'
                      }`}>
                        {/* Badge meilleure offre */}
                        {isBest && (
                          <div className="absolute -top-2.5 right-4">
                            <Badge className="bg-primary/10 text-primary border-none rounded-xl text-xs shadow-sm">
                              <Crown className="w-3 h-3 mr-1 text-primary" />
                              Meilleure offre
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          {/* Avatar chauffeur */}
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={offer.driver?.photo_url} />
                            <AvatarFallback className="bg-muted/50 text-sm font-medium">
                              {offer.driver?.display_name?.charAt(0) || 'D'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            {/* Nom et note */}
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm truncate">
                                {offer.driver?.display_name || 'Chauffeur'}
                              </p>
                              <div className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {offer.driver?.rating_average?.toFixed(1) || '5.0'}
                                </span>
                              </div>
                            </div>

                            {/* Véhicule et stats */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mb-2">
                              <span>{offer.driver?.vehicle_model || 'Véhicule'}</span>
                              <span className="text-border">•</span>
                              <span>{offer.driver?.completed_rides || 0} courses</span>
                              {offer.distance_to_pickup && (
                                <>
                                  <span className="text-border">•</span>
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {offer.distance_to_pickup.toFixed(1)}km
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Message du chauffeur */}
                            {offer.message && (
                              <div className="flex items-start gap-1.5 bg-muted/30 rounded-xl p-2.5 mb-2">
                                <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                                <p className="text-xs italic text-muted-foreground/80">{offer.message}</p>
                              </div>
                            )}

                            {/* Prix et économie */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xl font-bold tracking-tight text-primary">
                                  {offer.offered_price.toLocaleString()}
                                  <span className="text-xs font-medium ml-1 text-muted-foreground">CDF</span>
                                </p>
                                {savings > 0 && (
                                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    -{savings.toLocaleString()} CDF
                                  </p>
                                )}
                                {savings < 0 && (
                                  <p className="text-xs text-orange-600 dark:text-orange-400">
                                    +{Math.abs(savings).toLocaleString()} CDF
                                  </p>
                                )}
                              </div>

                              {offer.estimated_arrival_time && (
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                                    <Clock className="h-3 w-3" />
                                    <span>~{offer.estimated_arrival_time} min</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bouton accepter */}
                        <Button
                          onClick={() => handleAcceptOffer(offer.id)}
                          disabled={loading}
                          className="w-full mt-3 rounded-xl h-11"
                          variant={isBest ? 'default' : 'outline'}
                        >
                          Accepter cette offre
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Info paiement */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Wallet className="h-3.5 w-3.5 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground/50">
            Paiement après la course (espèces ou mobile money)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
