import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PartnerRentalSubscriptionPlans } from '@/components/rental/PartnerRentalSubscriptionPlans';
import { PartnerTierBadge } from '@/components/rental/PartnerTierBadge';
import { ArrowLeft, Calendar, CreditCard, History, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface CurrentSubscription {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  auto_renew: boolean;
  plan: {
    name: string;
    tier: string;
    monthly_price: number;
    currency: string;
    max_vehicles: number;
    features: any;
  };
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string;
  status: string;
}

export const PartnerRentalSubscriptionManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCurrentSubscription();
      fetchPaymentHistory();
    }
  }, [user]);

  const fetchCurrentSubscription = async () => {
    try {
      const { data: partner } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!partner) return;

      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .select(`
          *,
          plan:rental_subscription_plans(*)
        `)
        .eq('partner_id', partner.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCurrentSubscription(data as any);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const { data: partner } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!partner) return;

      // Note: Assuming a payment_history table exists or using subscriptions as proxy
      // For now, we'll show subscription history
      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .select(`
          id,
          start_date,
          plan:rental_subscription_plans(monthly_price, currency)
        `)
        .eq('partner_id', partner.id)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const history: PaymentHistory[] = (data || []).map((sub: any) => ({
        id: sub.id,
        amount: sub.plan?.monthly_price || 0,
        currency: 'CDF',
        payment_date: sub.start_date,
        payment_method: 'TembeaPay',
        status: 'completed'
      }));

      setPaymentHistory(history);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const handleCancelAutoRenew = async () => {
    if (!currentSubscription) return;

    try {
      const { error } = await supabase
        .from('partner_rental_subscriptions')
        .update({ auto_renew: false })
        .eq('id', currentSubscription.id);

      if (error) throw error;

      toast.success('Renouvellement automatique désactivé');
      fetchCurrentSubscription();
    } catch (error) {
      console.error('Error canceling auto-renew:', error);
      toast.error('Erreur lors de la désactivation');
    }
  };

  const handleEnableAutoRenew = async () => {
    if (!currentSubscription) return;

    try {
      const { error } = await supabase
        .from('partner_rental_subscriptions')
        .update({ auto_renew: true })
        .eq('id', currentSubscription.id);

      if (error) throw error;

      toast.success('Renouvellement automatique activé');
      fetchCurrentSubscription();
    } catch (error) {
      console.error('Error enabling auto-renew:', error);
      toast.error('Erreur lors de l\'activation');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="glassmorphism border-b sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto p-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            Gestion des Abonnements
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Current Subscription */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Mon Abonnement Actuel</h2>
          
          {loading ? (
            <Card className="glassmorphism">
              <CardContent className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ) : currentSubscription ? (
            <Card className="glassmorphism border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      {currentSubscription.plan.name}
                      <PartnerTierBadge tier={currentSubscription.plan.tier} />
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {currentSubscription.plan.monthly_price.toLocaleString()} CDF/mois
                    </p>
                  </div>
                  <Badge variant={currentSubscription.status === 'active' ? 'default' : 'outline'}>
                    {currentSubscription.status === 'active' ? 'Actif' : currentSubscription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Date de début</div>
                    <div className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(currentSubscription.start_date), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Date de fin</div>
                    <div className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(currentSubscription.end_date), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm font-semibold mb-2">Fonctionnalités incluses :</div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      ✅ Jusqu'à {currentSubscription.plan.max_vehicles} véhicules
                    </li>
                    {Array.isArray(currentSubscription.plan.features) && 
                      currentSubscription.plan.features.map((feature: any, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          ✅ {String(feature)}
                        </li>
                      ))
                    }
                  </ul>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Renouvellement automatique</span>
                    <Badge variant={currentSubscription.auto_renew ? 'default' : 'outline'}>
                      {currentSubscription.auto_renew ? 'Activé' : 'Désactivé'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={currentSubscription.auto_renew ? handleCancelAutoRenew : handleEnableAutoRenew}
                  >
                    {currentSubscription.auto_renew ? 'Désactiver' : 'Activer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glassmorphism">
              <CardContent className="py-12 text-center">
                <Crown className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Aucun abonnement actif</h3>
                <p className="text-muted-foreground mb-4">
                  Choisissez un plan ci-dessous pour commencer
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Plans Disponibles</h2>
          <PartnerRentalSubscriptionPlans />
        </div>

        {/* Payment History */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <History className="h-6 w-6" />
            Historique des Paiements
          </h2>
          
          {paymentHistory.length === 0 ? (
            <Card className="glassmorphism">
              <CardContent className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun paiement enregistré</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="glassmorphism">
              <CardContent className="p-0">
                <div className="divide-y">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            {payment.amount.toLocaleString()} CDF
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(payment.payment_date), 'dd MMMM yyyy', { locale: fr })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {payment.status === 'completed' ? 'Payé' : payment.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {payment.payment_method}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerRentalSubscriptionManagement;
