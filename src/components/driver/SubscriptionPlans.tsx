import React, { useEffect, useState } from 'react';
import { Zap, Gift, Truck, Car, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDriverServiceType } from '@/hooks/useDriverServiceType';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SubscriptionTicketCard } from './SubscriptionTicketCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface SubscriptionPlan {
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
  commission_rate?: number;
}

interface ActiveSubscription {
  id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  rides_used: number;
  rides_remaining: number;
  is_trial: boolean;
}

export const SubscriptionPlans: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'orange_money' | 'm_pesa' | 'airtel_money'>('orange_money');
  const [processing, setProcessing] = useState(false);
  const { serviceType } = useDriverServiceType();
  const [serviceFilter, setServiceFilter] = useState<'all' | 'transport' | 'delivery'>('all');
  const { toast } = useToast();

  // ✅ PHASE 5: Vocabulaire adapté
  const vocabulary = {
    rides: serviceType === 'delivery' ? 'livraisons' : 'courses',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ PHASE 5: Filtrer les plans selon le service
      const serviceTypeForQuery = serviceType === 'taxi' ? 'transport' : serviceType;
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .or(`service_type.eq.${serviceTypeForQuery},service_type.eq.all`)
        .order('price', { ascending: true });

      if (plansError) throw plansError;
      console.log(`🎫 Plans chargés pour service "${serviceType}":`, plansData?.length);
      setPlans(plansData || []);

      // Charger l'abonnement actif
      const { data: subscription } = await supabase
        .from('driver_subscriptions')
        .select('*')
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .single();

      setActiveSubscription(subscription);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (plan.is_trial) {
      toast({
        title: "Essai gratuit",
        description: "L'essai gratuit doit être accordé par un administrateur.",
        variant: "default",
      });
      return;
    }

    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    if (!selectedPlan || !phoneNumber) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('mobile-money-subscription', {
        body: {
          planId: selectedPlan.id,
          phoneNumber,
          paymentProvider,
          amount: selectedPlan.price,
          currency: selectedPlan.currency
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erreur de paiement');
      }

      toast({
        title: "✅ Paiement réussi",
        description: `Votre abonnement ${selectedPlan.name} est maintenant actif !`,
      });

      setPaymentDialogOpen(false);
      loadData(); // Recharger les données

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Erreur de paiement",
        description: error.message || 'Le paiement a échoué. Veuillez réessayer.',
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredPlans = plans.filter(plan => {
    if (serviceFilter === 'all') return true;
    return plan.service_type === serviceFilter;
  });

  // Détecter le plan le plus populaire (celui avec le plus de courses au meilleur prix)
  const popularPlanId = filteredPlans.reduce((prev, current) => {
    if (!prev) return current;
    const prevValue = prev.rides_included / (prev.price || 1);
    const currentValue = current.rides_included / (current.price || 1);
    return currentValue > prevValue ? current : prev;
  }, filteredPlans[0])?.id;

  if (loading) {
    return <div className="text-center py-8">Chargement des abonnements...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Abonnement actif avec nouveau design */}
      {activeSubscription && (
        <Card className="border-primary bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-6 w-6 text-primary" />
              🎫 Ticket d'Abonnement Actif
              {activeSubscription.is_trial && (
                <Badge variant="secondary" className="ml-auto">
                  <Gift className="h-3 w-3 mr-1" />
                  Essai Gratuit
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                <p className="text-xs text-muted-foreground mb-1">{vocabulary.rides.charAt(0).toUpperCase() + vocabulary.rides.slice(1)} restantes</p>
                <p className="text-3xl font-black text-success">{activeSubscription.rides_remaining}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">{vocabulary.rides.charAt(0).toUpperCase() + vocabulary.rides.slice(1)} utilisées</p>
                <p className="text-3xl font-black text-primary">{activeSubscription.rides_used}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                <p className="text-xs text-muted-foreground mb-1">Expire le</p>
                <p className="text-sm font-bold text-foreground">
                  {new Date(activeSubscription.end_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-info/10 to-info/5 border border-info/20">
                <p className="text-xs text-muted-foreground mb-1">Statut</p>
                <Badge variant="default" className="mt-1">{activeSubscription.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header avec filtres */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            🎫 Tickets d'Abonnement
          </h2>
        </div>

        {/* Filtres par type de service */}
        <Tabs value={serviceFilter} onValueChange={(v: any) => setServiceFilter(v)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />
              Tous
            </TabsTrigger>
            <TabsTrigger value="transport" className="gap-2">
              <Car className="h-4 w-4" />
              Taxi
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-2">
              <Truck className="h-4 w-4" />
              Livraison
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grille de tickets modernes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.map((plan) => (
          <SubscriptionTicketCard
            key={plan.id}
            plan={plan}
            onSubscribe={() => handleSubscribe(plan)}
            isDisabled={!!activeSubscription || plan.is_trial}
            isPopular={plan.id === popularPlanId && !plan.is_trial}
          />
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">Aucun plan disponible pour ce type de service</p>
        </div>
      )}

      {/* Dialog de paiement Mobile Money */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paiement Mobile Money</DialogTitle>
            <DialogDescription>
              Plan sélectionné: {selectedPlan?.name} - {selectedPlan?.price} {selectedPlan?.currency}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider de paiement</Label>
              <Select value={paymentProvider} onValueChange={(v: any) => setPaymentProvider(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="m_pesa">M-Pesa</SelectItem>
                  <SelectItem value="airtel_money">Airtel Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+243 XXX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={processing}>
              Annuler
            </Button>
            <Button onClick={processPayment} disabled={processing}>
              {processing ? 'Traitement...' : `Payer ${selectedPlan?.price} ${selectedPlan?.currency}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};