/**
 * 🚗 Plans d'abonnement pour chauffeurs taxi
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDriverSubscriptions } from '@/hooks/useDriverSubscriptions';
import { MobileMoneyPaymentDialog } from '../payment/MobileMoneyPaymentDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TaxiSubscriptionPlans = () => {
  const { plans, currentSubscription, loading, subscribeToplan } = useDriverSubscriptions();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Filtrer les plans taxi uniquement
  const taxiPlans = plans.filter(p => p.service_type === 'transport' || p.service_type === 'all');

  const handleSubscribe = (planId: string) => {
    const plan = taxiPlans.find(p => p.id === planId);
    if (!plan) return;

    if (plan.price === 0) {
      // Plan gratuit - activation directe
      subscribeToplan(planId, 'free');
    } else {
      // Plan payant - ouvrir dialog Mobile Money
      setSelectedPlanId(planId);
      setShowPaymentDialog(true);
    }
  };

  const handlePaymentSuccess = async () => {
    if (selectedPlanId) {
      await subscribeToplan(selectedPlanId, 'mobile_money_confirmed');
    }
    setShowPaymentDialog(false);
    setSelectedPlanId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedPlan = taxiPlans.find(p => p.id === selectedPlanId);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-foreground"
        >
          Plans Chauffeur Taxi
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          Choisissez le plan qui correspond à votre activité
        </motion.p>
      </div>

      {/* Abonnement actif */}
      {currentSubscription && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Abonnement actif : <strong>{currentSubscription.subscription_plans?.name}</strong>
            <br />
            {currentSubscription.rides_remaining} courses restantes
          </AlertDescription>
        </Alert>
      )}

      {/* Plans */}
      <div className="grid gap-6">
        {taxiPlans.map((plan, index) => {
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;
          const features = plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [];
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden p-6 ${
                isCurrentPlan ? 'border-2 border-green-500 shadow-lg' : ''
              }`}>
                {/* Badge recommandé */}
                {plan.badge_type === 'recommended' && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMANDÉ
                  </div>
                )}

                {/* Current plan indicator */}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
                )}

                {/* Header du plan */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">🚗</span>
                      <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                      {isCurrentPlan && (
                        <Crown className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">
                      {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} ${plan.currency}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.duration_type === 'weekly' ? 'par semaine' : 'par mois'}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {/* Commission réduite */}
                  {plan.commission_rate && plan.commission_rate < 12 && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {plan.commission_rate}% commission au lieu de 12%
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-sm text-foreground">
                      {plan.rides_included === -1 ? 'Courses illimitées' : `${plan.rides_included} courses au taux réduit`}
                    </span>
                  </div>
                  {features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || isCurrentPlan}
                  className={`w-full ${
                    isCurrentPlan
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  }`}
                >
                  {isCurrentPlan ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Plan actif
                    </>
                  ) : plan.price === 0 ? (
                    'Activer le plan gratuit'
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Souscrire à {plan.name}
                    </>
                  )}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Info supplémentaire */}
      <Card className="p-6 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">
              Paiement Mobile Money
            </h4>
            <p className="text-sm text-muted-foreground">
              Payez facilement avec Orange Money, M-Pesa ou Airtel Money. 
              Activation instantanée après confirmation du paiement.
            </p>
          </div>
        </div>
      </Card>

      {/* Mobile Money Payment Dialog */}
      {selectedPlan && (
        <MobileMoneyPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          planId={selectedPlanId!}
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
          currency={selectedPlan.currency}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
