/**
 * 💳 Carte abonnement réutilisable - Connectée aux vraies données
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, ArrowRight, Zap, Calendar, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDriverSubscription } from '@/hooks/useDriverSubscription';

interface SubscriptionCardProps {
  serviceType: 'taxi' | 'delivery';
}

export const SubscriptionCard = ({ serviceType }: SubscriptionCardProps) => {
  const navigate = useNavigate();
  const { subscription, loading } = useDriverSubscription(serviceType);

  const planColors = {
    free: 'muted-foreground',
    starter: 'muted-foreground',
    pro: 'primary',
    premium: 'purple-500'
  };

  const isPremium = subscription.plan === 'premium';
  const isPro = subscription.plan === 'pro';
  
  // Calculer les jours restants
  const daysRemaining = subscription.expiresAt 
    ? differenceInDays(new Date(subscription.expiresAt), new Date())
    : null;
  
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-40 mb-4" />
        <div className="h-10 bg-muted rounded w-24 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className={`p-6 relative overflow-hidden ${
        isPremium ? 'bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20' :
        isPro ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20' :
        'border-border'
      }`}>
        {/* Badge Premium flottant */}
        {isPremium && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-purple-500 text-white border-0">
              <Zap className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <Crown className={`w-5 h-5 ${isPremium ? 'text-purple-500' : isPro ? 'text-primary' : 'text-muted-foreground'}`} />
          <h3 className="font-semibold text-foreground">
            {subscription.billingMode === 'subscription' ? 'Abonnement actif' : 'Mode Commission'}
          </h3>
        </div>

        <div className="space-y-4">
          {/* Plan actuel + taux */}
          <div>
            <p className="text-sm text-muted-foreground">Plan actuel</p>
            <p className={`text-2xl font-bold ${
              isPremium ? 'text-purple-500' : isPro ? 'text-primary' : 'text-foreground'
            }`}>
              {subscription.planLabel}
            </p>
            <p className={`text-sm font-medium mt-1 ${
              subscription.commissionRate < subscription.normalRate ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              {subscription.commissionRate < subscription.normalRate 
                ? `${subscription.commissionRate}% commission (au lieu de ${subscription.normalRate}%)`
                : `${subscription.commissionRate}% commission par course`
              }
            </p>
          </div>

          {/* Courses restantes */}
          {subscription.ridesLimit && subscription.ridesRemaining !== null && (
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {serviceType === 'taxi' ? 'Courses restantes' : 'Livraisons restantes'}
                </span>
                <span className="font-bold text-foreground">
                  {subscription.ridesRemaining} / {subscription.ridesLimit}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    subscription.ridesRemaining < 5 ? 'bg-orange-500' : 'bg-primary'
                  }`}
                  style={{ 
                    width: `${Math.min((subscription.ridesRemaining / subscription.ridesLimit) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Date d'expiration */}
          {subscription.expiresAt && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              isExpired ? 'bg-red-500/10 text-red-600' :
              isExpiringSoon ? 'bg-orange-500/10 text-orange-600' :
              'bg-muted/50 text-muted-foreground'
            }`}>
              {isExpired || isExpiringSoon ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              <span className="text-sm">
                {isExpired ? 'Expiré' :
                 isExpiringSoon ? `Expire dans ${daysRemaining} jours` :
                 `Expire le ${format(new Date(subscription.expiresAt), 'dd MMMM yyyy', { locale: fr })}`
                }
              </span>
            </div>
          )}

          {/* Avantages */}
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Avantages inclus:</p>
            <ul className="space-y-1.5">
              {subscription.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="text-green-500 text-xs">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bouton Upgrade */}
          {!isPremium && (
            <Button 
              className={`w-full ${
                isPro ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' :
                'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80'
              }`}
              onClick={() => navigate('/app/chauffeur?tab=subscription')}
            >
              {isExpired ? 'Renouveler' : 'Upgrader mon plan'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
