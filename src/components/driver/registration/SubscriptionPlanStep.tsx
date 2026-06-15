import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, Zap, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDriverServiceType } from '@/hooks/useDriverServiceType';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  rides_included: number;
  is_trial: boolean;
  is_active: boolean;
}

interface SubscriptionPlanStepProps {
  selectedPlan: string | null;
  onPlanSelect: (planId: string) => void;
}

export const SubscriptionPlanStep: React.FC<SubscriptionPlanStepProps> = ({
  selectedPlan,
  onPlanSelect
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { serviceType } = useDriverServiceType();

  // ✅ PHASE 5: Vocabulaire adapté
  const vocabulary = {
    rides: serviceType === 'delivery' ? 'livraisons' : 'courses',
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // ✅ PHASE 5: Filtrer les plans selon le service
        const serviceTypeForQuery = serviceType === 'taxi' ? 'transport' : serviceType;
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .or(`service_type.eq.${serviceTypeForQuery},service_type.eq.all`)
          .order('price', { ascending: true });

        if (error) throw error;
        console.log(`🎫 Plans chargés pour inscription (${serviceType}):`, data?.length);
        setPlans(data || []);
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Erreur lors du chargement des plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [serviceType]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Alert Info Important */}
      <Alert className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <Sparkles className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-lg font-bold text-amber-900 dark:text-amber-100">
          🎉 Nouveau modèle économique : Plus de commissions !
        </AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200 mt-2">
          <ul className="space-y-2 list-disc list-inside">
            <li>✅ <strong>Gardez 100% de vos revenus</strong> par course</li>
            <li>✅ Payez seulement un <strong>abonnement mensuel fixe</strong></li>
            <li>✅ <strong>30 jours d'essai gratuit</strong> pour commencer</li>
            <li>✅ Aucune surprise, aucun pourcentage pris sur vos gains</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      {/* Cards Plans d'Abonnement */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isRecommended = plan.name === 'Standard Chauffeur';
          const isTrial = plan.is_trial;
          const isSelected = selectedPlan === plan.id;
          
          return (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.03, y: -8 }}
              className="relative"
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1 shadow-lg">
                    ⭐ Recommandé
                  </Badge>
                </div>
              )}
              
              <Card className={cn(
                "relative overflow-hidden transition-all duration-300",
                "hover:shadow-2xl",
                isRecommended && "border-2 border-amber-500 shadow-xl shadow-amber-500/20",
                isTrial && "border-2 border-green-500 shadow-xl shadow-green-500/20",
                isSelected && "ring-2 ring-amber-500 ring-offset-2"
              )}>
                {/* Background gradient */}
                <div className={cn(
                  "absolute inset-0 opacity-5",
                  isRecommended && "bg-gradient-to-br from-amber-500 to-orange-600",
                  isTrial && "bg-gradient-to-br from-green-500 to-emerald-600"
                )} />
                
                <CardHeader className="text-center relative z-10">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {plan.description || (isTrial ? 'Parfait pour débuter' : 'Le plus populaire')}
                  </CardDescription>
                  
                  {/* Prix */}
                  <div className="mt-4">
                    {isTrial ? (
                      <div>
                        <p className="text-5xl font-bold text-green-600 dark:text-green-400">
                          GRATUIT
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          30 jours d'essai
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-5xl font-bold text-amber-600 dark:text-amber-400">
                          {plan.price.toLocaleString()}
                          <span className="text-xl text-zinc-600 dark:text-zinc-400 ml-1">{plan.currency}</span>
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          par mois
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 relative z-10">
                  {/* Features */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {plan.rides_included} {vocabulary.rides}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          incluses par mois
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {[
                        '100% de vos revenus',
                        'Support prioritaire',
                        'Tableau de bord complet',
                        'Défis et récompenses'
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Bouton */}
                  <Button
                    onClick={() => onPlanSelect(plan.id)}
                    className={cn(
                      "w-full h-12 rounded-xl font-semibold transition-all",
                      isSelected
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
                        : "bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border-2"
                    )}
                  >
                    {isTrial ? 'Commencer l\'essai' : 'Choisir ce plan'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      
      {/* Info complémentaire */}
      <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Important :</strong> Après votre inscription, vous bénéficierez automatiquement de 
            l'<strong className="text-green-600">essai gratuit de 30 jours</strong>. Vous pourrez ensuite 
            choisir votre abonnement depuis votre tableau de bord.
          </span>
        </p>
      </div>
    </motion.div>
  );
};
