import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Check, Crown, Zap, Star, Wallet, X, Sparkles, TrendingUp, Clock, Shield } from 'lucide-react';
import { useRestaurantSubscription } from '@/hooks/useRestaurantSubscription';
import { useRestaurantWallet } from '@/hooks/useRestaurantWallet';
import { RestaurantTopUpDialog } from '@/components/restaurant/RestaurantTopUpDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function RestaurantSubscriptionPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  
  const { wallet, topUpWallet, topUpLoading } = useRestaurantWallet();
  const walletBalance = wallet?.balance || 0;

  const {
    plans,
    activeSubscription,
    fetchPlans,
    fetchActiveSubscription,
    subscribe,
    cancelAutoRenew,
    checkExpirationWarning,
  } = useRestaurantSubscription();

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const loadRestaurantData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/restaurant/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('restaurant_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setRestaurantId(profile.id);
        await Promise.all([
          fetchPlans(),
          fetchActiveSubscription(profile.id),
        ]);
      }
    } catch (error) {
      console.error('Error loading restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, planPrice: number, planName: string) => {
    if (!restaurantId) return;

    if (walletBalance < planPrice) {
      toast({
        title: 'Solde insuffisant',
        description: `Il vous manque ${(planPrice - walletBalance).toLocaleString()} CDF pour le plan ${planName}`,
        variant: 'destructive',
      });
      setTopUpDialogOpen(true);
      return;
    }

    setSubscribing(planId);

    const result = await subscribe(planId, restaurantId, 'kwenda_pay', true);

    if (result.success) {
      toast({
        title: '🎉 Abonnement activé !',
        description: `Vous êtes maintenant abonné au plan ${planName}`,
      });
      loadRestaurantData();
    }

    setSubscribing(null);
  };

  const handleCancelAutoRenew = async () => {
    if (!activeSubscription) return;

    const success = await cancelAutoRenew(activeSubscription.id);
    if (success) {
      loadRestaurantData();
    }
  };

  const getPlanIcon = (priorityLevel: number) => {
    switch (priorityLevel) {
      case 0: return Zap;
      case 1: return Star;
      case 2: return Crown;
      default: return Zap;
    }
  };

  const getPlanGradient = (priorityLevel: number) => {
    switch (priorityLevel) {
      case 0: return 'from-blue-500 to-cyan-500';
      case 1: return 'from-orange-500 to-red-500';
      case 2: return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const subscriptionWarning = activeSubscription 
    ? checkExpirationWarning(activeSubscription)
    : null;

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculer les jours restants
  const daysRemaining = activeSubscription
    ? Math.ceil((new Date(activeSubscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const progressPercent = activeSubscription
    ? Math.max(0, Math.min(100, (daysRemaining / 30) * 100))
    : 0;

  return (
    <div className="space-y-8">
      {/* Header avec gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 md:p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3"
              >
                <Sparkles className="h-8 w-8" />
                Abonnement Restaurant
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90"
              >
                Choisissez le plan adapté à votre activité
              </motion.p>
            </div>
            
            {/* Solde TAGAPay mini-card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-white/70">Solde TAGAPay</p>
                  <p className="text-xl font-bold">{walletBalance.toLocaleString()} CDF</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full mt-3"
                onClick={() => setTopUpDialogOpen(true)}
              >
                Recharger
              </Button>
            </motion.div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Abonnement actif */}
      <AnimatePresence>
        {activeSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl" />
              <CardHeader className="pt-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-3 rounded-xl bg-green-500/20">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-[15px] leading-tight">Abonnement Actif</CardTitle>
                      <CardDescription className="mt-0.5 flex items-center gap-2">
                        Plan <span className="font-semibold text-foreground">{activeSubscription.plan.name}</span>
                        <Badge className="bg-green-500 hover:bg-green-600 text-[10px] px-1.5 py-0">Actif</Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-green-600">{daysRemaining}</p>
                    <p className="text-xs text-muted-foreground">jours restants</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-sm">
                  <div className="p-2.5 rounded-lg bg-background/50">
                    <p className="text-muted-foreground text-xs">Date de fin</p>
                    <p className="font-semibold">
                      {new Date(activeSubscription.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/50">
                    <p className="text-muted-foreground text-xs">Commission</p>
                    <p className="font-semibold">{activeSubscription.plan.commission_rate}%</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/50">
                    <p className="text-muted-foreground text-xs">Renouvellement auto</p>
                    <p className="font-semibold">
                      {activeSubscription.auto_renew ? '✅ Activé' : '❌ Désactivé'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/50">
                    <p className="text-muted-foreground text-xs">Plats max</p>
                    <p className="font-semibold">{activeSubscription.plan.max_products || 'Illimité'}</p>
                  </div>
                </div>

                {subscriptionWarning?.isExpiring && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Expire dans {subscriptionWarning.daysRemaining} jours - Pensez à renouveler !
                    </p>
                  </div>
                )}

                {activeSubscription.auto_renew && (
                  <Button
                    variant="outline"
                    className="w-full text-sm h-9 text-muted-foreground"
                    onClick={handleCancelAutoRenew}
                  >
                    Désactiver le renouvellement automatique
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans disponibles */}
      <div>
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Choisissez votre plan
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(plan.priority_level);
            const gradient = getPlanGradient(plan.priority_level);
            const features = Array.isArray(plan.features) ? plan.features : [];
            const isCurrentPlan = activeSubscription?.plan_id === plan.id;
            const canAfford = walletBalance >= plan.monthly_price;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -4 }}
                className="relative"
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg px-3 py-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Recommandé
                    </Badge>
                  </div>
                )}
                
                <Card className={cn(
                  'relative overflow-hidden h-full transition-all duration-300',
                  plan.is_popular && 'border-2 border-orange-500/50 shadow-xl shadow-orange-500/10',
                  isCurrentPlan && 'border-2 border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
                )}>
                  {/* Gradient header */}
                  <div className={cn(
                    'h-2 bg-gradient-to-r',
                    gradient
                  )} />

                  <CardHeader className="text-center pt-6">
                    <div className={cn(
                      'w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4',
                      `bg-gradient-to-br ${gradient} shadow-lg`
                    )}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">{plan.monthly_price.toLocaleString()}</span>
                        <span className="text-muted-foreground">CDF</span>
                      </div>
                      <p className="text-sm text-muted-foreground">par mois</p>
                    </div>

                    <div className="space-y-3">
                      {plan.max_products && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1 rounded-full bg-green-500/10">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span>Jusqu'à <strong>{plan.max_products}</strong> plats</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <div className="p-1 rounded-full bg-green-500/10">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span>Commission <strong>{plan.commission_rate}%</strong></span>
                      </div>
                      {plan.can_feature_products && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1 rounded-full bg-green-500/10">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span>Mise en avant des plats</span>
                        </div>
                      )}
                      {plan.can_run_promotions && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1 rounded-full bg-green-500/10">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span>Promotions & réductions</span>
                        </div>
                      )}
                      {!plan.can_feature_products && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="p-1 rounded-full bg-muted">
                            <X className="h-3 w-3" />
                          </div>
                          <span>Mise en avant</span>
                        </div>
                      )}
                      {!plan.can_run_promotions && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="p-1 rounded-full bg-muted">
                            <X className="h-3 w-3" />
                          </div>
                          <span>Promotions</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    {isCurrentPlan ? (
                      <Button className="w-full" disabled variant="secondary">
                        <Check className="h-4 w-4 mr-2" />
                        Plan actuel
                      </Button>
                    ) : (
                      <Button
                        className={cn(
                          'w-full',
                          plan.is_popular && 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                        )}
                        onClick={() => handleSubscribe(plan.id, plan.monthly_price, plan.name)}
                        disabled={subscribing === plan.id}
                      >
                        {subscribing === plan.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Traitement...
                          </>
                        ) : !canAfford ? (
                          <>
                            <Wallet className="h-4 w-4 mr-2" />
                            Recharger ({(plan.monthly_price - walletBalance).toLocaleString()} CDF)
                          </>
                        ) : (
                          <>
                            S'abonner maintenant
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dialog de recharge */}
      <RestaurantTopUpDialog
        open={topUpDialogOpen}
        onOpenChange={setTopUpDialogOpen}
        currentBalance={walletBalance}
        onSuccess={() => loadRestaurantData()}
        onTopUp={async (amount, method, phone) => {
          await topUpWallet({ amount, payment_method: method as any, phone_number: phone });
        }}
        loading={topUpLoading}
      />
    </div>
  );
}
