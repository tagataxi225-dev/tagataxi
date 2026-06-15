import React from 'react';
import { Check, Zap, Gift, Ticket, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SubscriptionTicketCardProps {
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    rides_included: number;
    price_per_extra_ride: number;
    is_trial: boolean;
    trial_duration_days: number;
    service_type: string;
    is_active: boolean;
  };
  onSubscribe: () => void;
  isDisabled?: boolean;
  isPopular?: boolean;
}

export const SubscriptionTicketCard: React.FC<SubscriptionTicketCardProps> = ({
  plan,
  onSubscribe,
  isDisabled = false,
  isPopular = false,
}) => {
  const isTrial = plan.is_trial;
  const serviceColor = plan.service_type === 'delivery' 
    ? 'hsl(var(--congo-blue))' 
    : 'hsl(var(--congo-red))';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Badge "Populaire" */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-congo-yellow to-congo-yellow-electric text-foreground shadow-lg">
            <TrendingUp className="h-3 w-3 mr-1" />
            Populaire
          </Badge>
        </div>
      )}

      {/* Carte Ticket */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-card via-card to-muted/30",
        "border-2 transition-all duration-300",
        isPopular ? "border-congo-yellow shadow-[0_0_30px_rgba(255,193,7,0.3)]" : "border-border hover:border-primary/50",
        !isDisabled && "hover:shadow-2xl hover:scale-[1.02]",
        isTrial && "border-success/50 bg-gradient-to-br from-success/5 via-card to-success/10"
      )}>
        
        {/* Effet de perforation supérieur */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background/50 to-transparent">
          <div className="flex justify-between px-4">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="w-3 h-3 rounded-full bg-background border border-border/40 -mt-1.5"
              />
            ))}
          </div>
        </div>

        {/* Header avec badge service */}
        <div className="relative pt-8 px-6 pb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5" style={{ color: serviceColor }} />
              <Badge variant="outline" className="uppercase text-xs font-bold" style={{ borderColor: serviceColor, color: serviceColor }}>
                {plan.service_type === 'delivery' ? '📦 Livraison' : '🚕 Taxi'}
              </Badge>
            </div>
            {isTrial && (
              <Badge className="bg-success text-success-foreground">
                <Gift className="h-3 w-3 mr-1" />
                Gratuit
              </Badge>
            )}
          </div>

          {/* Nom du plan */}
          <h3 className="text-2xl font-bold mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {plan.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{plan.description}</p>
        </div>

        {/* Prix central avec animation */}
        <div className="px-6 py-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-y border-border/40">
          <div className="text-center">
            {plan.price === 0 ? (
              <div className="text-4xl font-black bg-gradient-to-r from-success to-success-light bg-clip-text text-transparent">
                GRATUIT
              </div>
            ) : (
              <>
                <div className="text-5xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  {plan.price.toLocaleString()}
                  <span className="text-xl ml-2 opacity-80">{plan.currency}</span>
                </div>
                {plan.price_per_extra_ride > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    + {plan.price_per_extra_ride} {plan.currency} / course supplémentaire
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Détails courses et durée */}
        <div className="px-6 py-4 space-y-3">
          {/* Compteur de courses avec animation */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Courses incluses</span>
            </div>
            <motion.div 
              className="text-2xl font-black text-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              {plan.rides_included}
            </motion.div>
          </div>

          {/* Durée */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Valable <span className="font-bold text-foreground">{plan.trial_duration_days || 30} jours</span>
            </span>
          </div>

          {/* Avantages */}
          <ul className="space-y-2 pt-2">
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span>Accès illimité pendant la période</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span>Support technique prioritaire</span>
            </li>
            {isTrial && (
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="font-semibold text-success">Période d'essai sans engagement</span>
              </li>
            )}
          </ul>
        </div>

        {/* Bouton d'action */}
        <div className="px-6 pb-6 pt-2">
          <Button
            className={cn(
              "w-full font-bold text-base h-12 rounded-xl",
              "transition-all duration-300",
              isTrial && "bg-gradient-to-r from-success to-success-light hover:from-success-light hover:to-success",
              !isTrial && !isDisabled && "bg-gradient-to-r from-primary to-accent hover:from-primary-light hover:to-accent-light shadow-lg hover:shadow-xl"
            )}
            onClick={onSubscribe}
            disabled={isDisabled}
            variant={isTrial ? 'default' : 'default'}
          >
            {isTrial ? (
              <>
                <Gift className="h-5 w-5 mr-2" />
                Contactez un admin
              </>
            ) : (
              <>
                <Ticket className="h-5 w-5 mr-2" />
                Souscrire maintenant
              </>
            )}
          </Button>
        </div>

        {/* Effet de perforation inférieur */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/50 to-transparent">
          <div className="flex justify-between px-4">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="w-3 h-3 rounded-full bg-background border border-border/40 -mb-1.5"
              />
            ))}
          </div>
        </div>

        {/* QR Code placeholder (coin inférieur droit) */}
        <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center opacity-20">
          <Ticket className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  );
};
