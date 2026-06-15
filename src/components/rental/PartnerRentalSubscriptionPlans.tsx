import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: string;
  monthly_price: number;
  currency: string;
  max_vehicles: number;
  featured_in_homepage: boolean;
  custom_banner: boolean;
  priority_support: boolean;
  analytics_access: boolean;
  features: string[];
}

export const PartnerRentalSubscriptionPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price', { ascending: true });

      if (error) throw error;
      setPlans((data || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        tier: p.tier || 'basic',
        monthly_price: p.monthly_price,
        currency: p.currency,
        max_vehicles: p.max_vehicles || 5,
        featured_in_homepage: p.featured_in_homepage || false,
        custom_banner: p.custom_banner || false,
        priority_support: p.priority_support || false,
        analytics_access: p.analytics_access || false,
        features: Array.isArray(p.features) ? p.features.map(f => String(f)) : []
      })));
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const { data: partner } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (partner) {
        const { data: sub } = await supabase
          .from('partner_rental_subscriptions')
          .select('plan_id')
          .eq('partner_id', partner.id)
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .order('end_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        setCurrentPlanId(sub?.plan_id || null);
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      const { data: partner } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!partner) {
        toast.error('Partenaire introuvable');
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      // Note: vehicle_id requis par le schéma, utiliser NULL ou premier véhicule
      const { data: firstVehicle } = await supabase
        .from('rental_vehicles')
        .select('id')
        .eq('partner_id', partner.id)
        .limit(1)
        .maybeSingle();

      const { error } = await supabase
        .from('partner_rental_subscriptions')
        .insert({
          partner_id: partner.id,
          vehicle_id: firstVehicle?.id || null,
          plan_id: planId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active',
          auto_renew: true
        } as any);

      if (error) throw error;

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f6d365', '#fda085', '#daa520']
      });

      toast.success('🎉 Abonnement activé ! Votre boutique est maintenant premium !');
      fetchCurrentSubscription();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Erreur lors de la souscription');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Plans d'Abonnement Location</h1>
        <p className="text-muted-foreground">Choisissez le plan adapté à votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(plan => (
          <Card
            key={plan.id}
            className={cn(
              "relative overflow-hidden transition-all hover:scale-105",
              plan.tier === 'gold' && "border-yellow-500 border-2 shadow-2xl"
            )}
          >
            {plan.tier === 'gold' && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600">
                  ⭐ Populaire
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-4xl font-bold">
                  {(plan.monthly_price / 1000).toFixed(0)}K
                </span>
                <span className="text-muted-foreground"> CDF/mois</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}

              <Button
                className={cn(
                  "w-full mt-6",
                  plan.tier === 'gold' && "bg-gradient-to-r from-amber-500 to-yellow-600"
                )}
                onClick={() => handleSubscribe(plan.id)}
                disabled={currentPlanId === plan.id}
              >
                {currentPlanId === plan.id ? 'Abonnement actuel' : 'Souscrire'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
