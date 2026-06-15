import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRentalSubscriptions } from '@/hooks/useRentalSubscriptions';
import { usePartnerRentals } from '@/hooks/usePartnerRentals';
import { ModernPaymentDialog } from './ModernPaymentDialog';
import { Car, CreditCard, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const RentalSubscriptionManager = () => {
  const { 
    plans, 
    subscriptions, 
    payments, 
    loading, 
    subscribeToPlan, 
    isSubscribing,
    cancelSubscription,
    getVehicleSubscriptionStatus,
    getPlanForCategory 
  } = useRentalSubscriptions();
  
  const { vehicles } = usePartnerRentals();
  
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleSubscribe = (planId: string, vehicleId: string) => {
    const plan = plans.find(p => p.id === planId);
    setSelectedPlan(planId);
    setSelectedVehicle(vehicleId);
    setPaymentData({
      planId,
      vehicleId,
      amount: plan?.monthly_price || 0,
      planName: plan?.name || ''
    });
    setShowPayment(true);
  };

  const handlePayment = async (data: { provider: string; phoneNumber: string; autoRenew: boolean }) => {
    await subscribeToPlan({
      planId: paymentData.planId,
      vehicleId: paymentData.vehicleId,
      provider: data.provider,
      phoneNumber: data.phoneNumber,
      autoRenew: data.autoRenew
    });
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
    setPaymentData(null);
  };

  const getStatusBadge = (status: string, endDate?: string) => {
    const isExpired = endDate && new Date(endDate) < new Date();
    
    if (status === 'active' && !isExpired) {
      return <Badge className="bg-success text-success-foreground">Actif</Badge>;
    } else if (status === 'active' && isExpired) {
      return <Badge variant="destructive">Expiré</Badge>;
    } else if (status === 'cancelled') {
      return <Badge variant="secondary">Annulé</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Payé</Badge>;
      case 'processing':
        return <Badge className="bg-warning text-warning-foreground">En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} CDF`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Abonnements Location</h2>
          <p className="text-muted-foreground">
            Gérez vos abonnements pour rendre vos véhicules visibles aux clients
          </p>
        </div>
      </div>

      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vehicles">Mes Véhicules</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements Actifs</TabsTrigger>
          <TabsTrigger value="payments">Historique Paiements</TabsTrigger>
          <TabsTrigger value="plans">Plans Disponibles</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => {
              const subscriptionStatus = getVehicleSubscriptionStatus(vehicle.id);
              const plan = vehicle.category_id ? getPlanForCategory(vehicle.category_id) : null;

              return (
                <Card key={vehicle.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                        <CardDescription>
                          {vehicle.brand} {vehicle.model} • {vehicle.year}
                        </CardDescription>
                      </div>
                      <Car className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Statut</span>
                      {subscriptionStatus.isActive ? (
                        <Badge className="bg-success text-success-foreground">Visible</Badge>
                      ) : (
                        <Badge variant="outline">Non visible</Badge>
                      )}
                    </div>

                    {subscriptionStatus.isActive ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Expire le</span>
                          <span className="font-medium">
                            {format(new Date(subscriptionStatus.expiresAt!), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Jours restants</span>
                          <span className={`font-medium ${subscriptionStatus.daysRemaining <= 7 ? 'text-destructive' : 'text-foreground'}`}>
                            {subscriptionStatus.daysRemaining}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => cancelSubscription(subscriptionStatus.subscription!.id)}
                        >
                          Annuler l'abonnement
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {plan ? (
                          <>
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-sm font-medium">{plan.name}</div>
                              <div className="text-lg font-bold text-primary">
                                {formatCurrency(plan.monthly_price)}/mois
                              </div>
                            </div>
                            <Button
                              onClick={() => handleSubscribe(plan.id, vehicle.id)}
                              disabled={isSubscribing}
                              className="w-full"
                            >
                              {isSubscribing ? 'Traitement...' : 'S\'abonner'}
                            </Button>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            Aucun plan disponible pour cette catégorie
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {subscription.rental_vehicles?.name}
                      </CardTitle>
                      <CardDescription>
                        {subscription.rental_subscription_plans?.name}
                      </CardDescription>
                    </div>
                    {getStatusBadge(subscription.status, subscription.end_date)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Début</span>
                      <div className="font-medium">
                        {format(new Date(subscription.start_date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fin</span>
                      <div className="font-medium">
                        {format(new Date(subscription.end_date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Renouvellement</span>
                      <div className="font-medium">
                        {subscription.auto_renew ? 'Automatique' : 'Manuel'}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prix</span>
                      <div className="font-medium">
                        {formatCurrency(subscription.rental_subscription_plans?.monthly_price || 0)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="font-medium">
                          {payment.metadata?.plan_name || 'Abonnement Location'}
                        </span>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(payment.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </div>
                      {payment.transaction_id && (
                        <div className="text-xs text-muted-foreground">
                          Transaction: {payment.transaction_id}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.provider} • {payment.phone_number}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(plan.monthly_price)}
                    <span className="text-sm font-normal text-muted-foreground">/mois</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Avantages inclus :</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modern Payment Dialog */}
      {showPayment && paymentData && (
        <ModernPaymentDialog
          isOpen={showPayment}
          onClose={handlePaymentClose}
          planName={paymentData.planName}
          amount={paymentData.amount}
          currency="CDF"
          onPayment={handlePayment}
          isProcessing={isSubscribing}
        />
      )}
    </div>
  );
};