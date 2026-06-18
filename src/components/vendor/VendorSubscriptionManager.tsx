import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useVendorWallet } from '@/hooks/useVendorWallet';
import { VendorSubscriptionPaymentDialog } from './VendorSubscriptionPaymentDialog';
import { Check, Crown, Zap, Star, TrendingUp, Shield, BarChart3, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  max_products: number | null;
  commission_rate: number;
  features: string[];
  priority_support: boolean;
  analytics_enabled: boolean;
  verified_badge: boolean;
  is_active: boolean;
  is_popular?: boolean;
}

interface ActiveSubscription {
  id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  payment_method: string;
}

export const VendorSubscriptionManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { wallet, loading: walletLoading, refetch: refetchWallet } = useVendorWallet();
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  
  // Dialog state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 1. Charger les plans disponibles
      const { data: plansData, error: plansError } = await supabase
        .from('vendor_subscription_plans')
        .select(`
          id,
          name,
          name_en,
          description,
          price,
          currency,
          duration_days,
          duration_type,
          max_products,
          commission_rate,
          priority_support,
          analytics_enabled,
          verified_badge,
          features,
          is_active,
          is_popular
        `)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (plansError) {
        console.error('❌ Error loading plans:', plansError);
        throw plansError;
      }
      
      setPlans(plansData as any || []);

      // 2. Charger l'abonnement actif
      const { data: subData, error: subError } = await supabase
        .from('vendor_active_subscriptions' as any)
        .select(`
          id,
          vendor_id,
          plan_id,
          status,
          payment_method,
          start_date,
          end_date,
          auto_renew,
          vendor_subscription_plans (
            id,
            name,
            description,
            price,
            currency,
            max_products,
            commission_rate,
            priority_support,
            analytics_enabled,
            verified_badge,
            features
          )
        `)
        .eq('vendor_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        console.error('❌ Error loading subscription:', subError);
        throw subError;
      }

      // 3. Si aucun abonnement, assigner le plan gratuit automatiquement
      if (!subData && plansData && plansData.length > 0) {
        const freePlan = (plansData as any).find((p: any) => p.price === 0);
        if (freePlan) {
          await handleUpgradeConfirmed(freePlan.id, true);
          return;
        }
      }

      if (subData) {
        setActiveSubscription(subData as any);
        setCurrentPlan((subData as any).vendor_subscription_plans);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les abonnements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    // Si plan gratuit, activer directement
    if (plan.price === 0) {
      handleUpgradeConfirmed(plan.id, true);
      return;
    }
    
    // Sinon, ouvrir le dialogue de confirmation
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handleUpgradeConfirmed = async (planId: string, isFree: boolean = false) => {
    if (!user) return;

    const plan = plans.find(p => p.id === planId) || selectedPlan;
    if (!plan) return;

    try {
      setUpgradingPlan(planId);

      const { data, error } = await supabase.functions.invoke('vendor-subscription-manager', {
        body: {
          plan_id: planId,
          vendor_id: user.id,
          payment_method: isFree ? 'free' : 'wallet'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "🎉 Abonnement activé!",
          description: (
            <div className="flex flex-col gap-1">
              <span>Plan {plan.name} actif</span>
              <span className="text-xs text-muted-foreground">
                Commission réduite à {plan.commission_rate}%
              </span>
            </div>
          ),
        });
        
        setShowPaymentDialog(false);
        setSelectedPlan(null);
        loadData();
        refetchWallet();
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible d'activer l'abonnement",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'activer l'abonnement",
        variant: "destructive"
      });
    } finally {
      setUpgradingPlan(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'premium':
        return <Crown className="h-6 w-6" />;
      case 'standard':
        return <Zap className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  const getPlanGradient = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'premium':
        return 'from-amber-500/20 via-yellow-500/10 to-orange-500/5 border-amber-500/30';
      case 'standard':
        return 'from-blue-500/20 via-cyan-500/10 to-sky-500/5 border-blue-500/30';
      default:
        return 'from-slate-500/10 via-gray-500/5 to-zinc-500/5 border-slate-500/20';
    }
  };

  const getPlanIconColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'premium':
        return 'text-amber-500 bg-amber-500/10';
      case 'standard':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-slate-500 bg-slate-500/10';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement des abonnements...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan actuel */}
      {currentPlan && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getPlanIconColor(currentPlan.name)}`}>
                  {getPlanIcon(currentPlan.name)}
                </div>
                <div>
                  <CardTitle className="text-xl">Votre abonnement actuel</CardTitle>
                  <CardDescription>Plan {currentPlan.name}</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2 bg-green-600">
                {currentPlan.commission_rate}% commission
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Produits</p>
                  <p className="font-semibold">
                    {currentPlan.max_products && currentPlan.max_products > 0 ? `${currentPlan.max_products} max` : 'Illimités'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Support</p>
                  <p className="font-semibold">
                    {currentPlan.priority_support ? 'Prioritaire' : 'Standard'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Analytics</p>
                  <p className="font-semibold">
                    {currentPlan.analytics_enabled ? 'Avancées' : 'Basiques'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans disponibles */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Plans disponibles</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const canUpgrade = !isCurrentPlan && (!currentPlan || plan.price > currentPlan.price);
            const isUpgrading = upgradingPlan === plan.id;
            const commissionSaving = currentPlan ? currentPlan.commission_rate - plan.commission_rate : 10 - plan.commission_rate;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: canUpgrade ? 1.02 : 1 }}
              >
                <Card className={`relative overflow-hidden bg-gradient-to-br ${getPlanGradient(plan.name)} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
                  {/* Badge Populaire */}
                  {plan.is_popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-blue-600 text-white">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Populaire
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-full ${getPlanIconColor(plan.name)}`}>
                        {getPlanIcon(plan.name)}
                      </div>
                      {plan.price > 0 ? (
                        <Badge variant="outline" className="font-bold">
                          {plan.price.toLocaleString()} CDF/mois
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Gratuit</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Commission et économies */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Commission</span>
                        <span className="font-bold text-lg text-primary">{plan.commission_rate}%</span>
                      </div>
                      
                      {commissionSaving > 0 && !isCurrentPlan && (
                        <Badge className="w-full justify-center bg-green-500/20 text-green-700 hover:bg-green-500/30">
                          🎯 Économisez {commissionSaving}% sur chaque vente!
                        </Badge>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Produits</span>
                        <span className="font-semibold">
                          {plan.max_products && plan.max_products > 0 ? plan.max_products : 'Illimités'}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bouton action */}
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrentPlan || !canUpgrade || isUpgrading}
                      className={`w-full h-12 font-semibold ${
                        isCurrentPlan 
                          ? 'bg-muted text-muted-foreground' 
                          : canUpgrade 
                            ? plan.name.toLowerCase() === 'premium'
                              ? 'bg-amber-500 hover:bg-amber-600 text-black'
                              : plan.name.toLowerCase() === 'standard'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : ''
                            : ''
                      }`}
                      variant={isCurrentPlan ? 'outline' : canUpgrade ? 'default' : 'secondary'}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Activation...
                        </>
                      ) : isCurrentPlan ? (
                        '✓ Plan actuel'
                      ) : canUpgrade ? (
                        plan.price === 0 ? 'Activer gratuitement' : `Souscrire • ${plan.price.toLocaleString()} CDF`
                      ) : (
                        'Plan inférieur'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Informations supplémentaires */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">💡 Bon à savoir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• La commission est automatiquement déduite à chaque vente livrée</p>
          <p>• Vous recevez 85-95% du prix de vente selon votre plan</p>
          <p>• Les paiements sont crédités instantanément dans votre wallet TAGA</p>
          <p>• Changement de plan disponible à tout moment</p>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <VendorSubscriptionPaymentDialog
        open={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        walletBalance={wallet?.balance || 0}
        currentCommissionRate={currentPlan?.commission_rate || 10}
        onConfirm={() => selectedPlan && handleUpgradeConfirmed(selectedPlan.id)}
        isProcessing={!!upgradingPlan}
      />
    </div>
  );
};
