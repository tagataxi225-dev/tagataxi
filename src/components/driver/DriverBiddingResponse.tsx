import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingDown, TrendingUp, Clock, Navigation, DollarSign, Zap, Minus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DriverBiddingResponseProps {
  bookingId: string;
  clientProposedPrice: number;
  estimatedPrice: number;
  pickupLocation: string;
  distanceToPickup: number;
  onResponseSubmitted?: () => void;
  currency?: 'CDF';
  distance?: number;
}

export default function DriverBiddingResponse({
  bookingId,
  clientProposedPrice,
  estimatedPrice,
  pickupLocation,
  distanceToPickup,
  onResponseSubmitted,
  currency = 'CDF',
  distance = 0
}: DriverBiddingResponseProps) {
  const [loading, setLoading] = useState(false);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [counterOfferPrice, setCounterOfferPrice] = useState(
    Math.floor((clientProposedPrice + estimatedPrice) / 2)
  );

  const increment = 1000; // 1000 CDF pour des ajustements plus rapides
  const minCounterOffer = clientProposedPrice;
  const maxCounterOffer = Math.ceil(estimatedPrice * 1.2);

  const discount = ((estimatedPrice - clientProposedPrice) / estimatedPrice * 100).toFixed(0);
  const isLowOffer = clientProposedPrice < estimatedPrice * 0.7;
  const estimatedArrival = Math.ceil(distanceToPickup * 2.5);

  // Calcul gain net
  const netGain = Math.floor(clientProposedPrice * 0.9);
  const counterNetGain = Math.floor(counterOfferPrice * 0.9);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: driver } = await supabase
        .from('chauffeurs')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driver) throw new Error('Profil chauffeur non trouvé');

      // TODO: ajouter en DB → ALTER TABLE ride_offers ADD CONSTRAINT uq_ride_offers_booking_driver UNIQUE (booking_id, driver_id);
      const { error: offerError } = await supabase
        .from('ride_offers')
        .upsert({
          booking_id: bookingId,
          driver_id: driver.id,
          offered_price: clientProposedPrice,
          original_estimated_price: estimatedPrice,
          is_counter_offer: false,
          client_proposal_price: clientProposedPrice,
          status: 'pending',
          message: 'Offre acceptée',
          distance_to_pickup: distanceToPickup
        } as any, { onConflict: 'booking_id,driver_id' });

      if (offerError) throw offerError;

      toast.success('Offre acceptée !', {
        description: 'Le client a été notifié'
      });

      onResponseSubmitted?.();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast.error('Erreur lors de l\'acceptation');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterOffer = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: driver } = await supabase
        .from('chauffeurs')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driver) throw new Error('Profil chauffeur non trouvé');

      // TODO: ajouter en DB → ALTER TABLE ride_offers ADD CONSTRAINT uq_ride_offers_booking_driver UNIQUE (booking_id, driver_id);
      const { error: offerError } = await supabase
        .from('ride_offers')
        .upsert({
          booking_id: bookingId,
          driver_id: driver.id,
          offered_price: counterOfferPrice,
          original_estimated_price: estimatedPrice,
          is_counter_offer: true,
          client_proposal_price: clientProposedPrice,
          status: 'pending',
          message: `Contre-offre: ${counterOfferPrice.toLocaleString()} ${currency}`,
          distance_to_pickup: distanceToPickup
        } as any, { onConflict: 'booking_id,driver_id' });

      if (offerError) throw offerError;

      toast.success('Contre-offre envoyée !', {
        description: `${counterOfferPrice.toLocaleString()} ${currency}`
      });

      onResponseSubmitted?.();
    } catch (error) {
      console.error('Error sending counter-offer:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const handleRefuse = () => {
    toast.info('Course ignorée');
    onResponseSubmitted?.();
  };

  // Quick counter offer presets
  const counterPresets = [
    { label: 'Client', value: clientProposedPrice },
    { label: 'Milieu', value: Math.floor((clientProposedPrice + estimatedPrice) / 2) },
    { label: 'Tembea', value: estimatedPrice },
  ];

  if (showCounterOffer) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <Card className="p-5 space-y-4 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/20">
          <div className="text-center">
            <h3 className="font-bold text-lg flex items-center justify-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              Votre contre-offre
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Client: {clientProposedPrice.toLocaleString()} {currency}
            </p>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-3 gap-2">
            {counterPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setCounterOfferPrice(preset.value)}
                className={`p-2 rounded-xl text-xs font-medium transition-all ${
                  counterOfferPrice === preset.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Price adjuster - Modern +/- buttons with editable input */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCounterOfferPrice(prev => Math.max(prev - increment, minCounterOffer))}
              disabled={counterOfferPrice <= minCounterOffer}
              className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-40 transition-all active:scale-95 border-2 border-border/50"
            >
              <Minus className="h-6 w-6" />
            </button>

            <div className="relative">
              <input
                type="number"
                value={counterOfferPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    setCounterOfferPrice(Math.max(minCounterOffer, Math.min(maxCounterOffer, val)));
                  }
                }}
                className="w-40 h-16 text-center text-3xl font-bold bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                {currency}
              </span>
            </div>

            <button
              onClick={() => setCounterOfferPrice(prev => Math.min(prev + increment, maxCounterOffer))}
              disabled={counterOfferPrice >= maxCounterOffer}
              className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center disabled:opacity-40 transition-all active:scale-95 border-2 border-border/50"
            >
              <Plus className="h-6 h-6" />
            </button>
          </div>

          {/* Net gain */}
          <div className="text-center p-3 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">Votre gain net</p>
            <p className="text-xl font-bold text-primary">{counterNetGain.toLocaleString()} {currency}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCounterOffer(false)}
              disabled={loading}
              className="flex-1 h-12 rounded-xl"
            >
              Retour
            </Button>
            <Button
              onClick={handleCounterOffer}
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600"
            >
              {loading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-background dark:from-amber-950/30 dark:via-orange-950/20">
        {/* Header */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="font-bold">Enchère client</span>
          </div>
          {isLowOffer && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <TrendingDown className="h-3 w-3 mr-1" />
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Price comparison */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Prix Tembea</p>
              <p className="text-xl font-bold">{estimatedPrice.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{currency}</p>
            </div>
            
            <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Offre client</p>
              <p className="text-xl font-bold text-primary">{clientProposedPrice.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{currency}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {pickupLocation?.slice(0, 25)}...
          </span>
          <span className="flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            {distanceToPickup.toFixed(1)} km
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            ~{estimatedArrival} min
          </span>
        </div>

        {/* Net gain info */}
        <div className="mx-4 mb-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
          <p className="text-xs text-muted-foreground">Votre gain net (après commission)</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{netGain.toLocaleString()} {currency}</p>
        </div>

        {/* Actions */}
        <div className="p-4 pt-2 space-y-2">
          <Button
            onClick={handleAccept}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 font-semibold shadow-lg shadow-emerald-500/25"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Accepter {clientProposedPrice.toLocaleString()} {currency}
          </Button>

          <Button
            onClick={() => setShowCounterOffer(true)}
            disabled={loading}
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold"
          >
            <Zap className="h-4 w-4 mr-2" />
            Contre-offre
          </Button>

          <Button
            onClick={handleRefuse}
            disabled={loading}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Ignorer
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
