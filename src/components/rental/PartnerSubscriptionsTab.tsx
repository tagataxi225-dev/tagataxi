import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CreditCard, Truck, Car, RefreshCw, TrendingUp } from 'lucide-react';
import { useRentalVehicleSubscription } from '@/hooks/useRentalVehicleSubscription';
import { VehicleSubscriptionCard } from './VehicleSubscriptionCard';
import { VehicleSubscriptionModal } from './VehicleSubscriptionModal';
import { toast } from 'sonner';

interface PartnerSubscriptionsTabProps {
  vehicles: any[];
  categories: any[];
}

export const PartnerSubscriptionsTab: React.FC<PartnerSubscriptionsTabProps> = ({
  vehicles,
  categories
}) => {
  const { 
    subscriptions, 
    renewSubscription, 
    cancelSubscription, 
    getExpiringSubscriptions,
    expiringCount,
    isLoading 
  } = useRentalVehicleSubscription();

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const expiringSubscriptions = getExpiringSubscriptions();
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired' || s.status === 'cancelled');

  // Véhicules sans abonnement actif
  const vehiclesWithoutSubscription = vehicles.filter(v => 
    !subscriptions.some(s => s.vehicle_id === v.id && s.status === 'active')
  );

  const handleRenew = async (subscriptionId: string) => {
    setProcessingId(subscriptionId);
    try {
      await renewSubscription.mutateAsync(subscriptionId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpgrade = (subscriptionId: string) => {
    const sub = subscriptions.find(s => s.id === subscriptionId);
    if (sub?.vehicle_id) {
      const vehicle = vehicles.find(v => v.id === sub.vehicle_id);
      if (vehicle) {
        const category = categories.find(c => c.id === vehicle.category_id);
        setSelectedVehicle({
          ...vehicle,
          categoryName: category?.name || 'Standard'
        });
        setIsModalOpen(true);
      }
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?')) return;
    
    setProcessingId(subscriptionId);
    try {
      await cancelSubscription.mutateAsync(subscriptionId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleActivateVehicle = (vehicle: any) => {
    const category = categories.find(c => c.id === vehicle.category_id);
    setSelectedVehicle({
      ...vehicle,
      categoryName: category?.name || 'Standard'
    });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 space-y-3">
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertes d'expiration */}
      {expiringCount > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base text-amber-600">
                {expiringCount} abonnement{expiringCount > 1 ? 's' : ''} expire{expiringCount > 1 ? 'nt' : ''} bientôt
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Renouvelez vos abonnements pour maintenir vos véhicules actifs
            </p>
            <div className="flex flex-wrap gap-2">
              {expiringSubscriptions.slice(0, 3).map(sub => (
                <Badge key={sub.id} variant="outline" className="bg-amber-500/10">
                  {sub.vehicle_name || 'Véhicule'}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Actifs</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{activeSubscriptions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Expirent bientôt</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{expiringCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sans abonnement</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{vehiclesWithoutSubscription.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total véhicules</span>
            </div>
            <p className="text-2xl font-bold">{vehicles.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Actifs ({activeSubscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            À activer ({vehiclesWithoutSubscription.length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expirés ({expiredSubscriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun abonnement actif</h3>
                <p className="text-muted-foreground">
                  Activez vos véhicules en souscrivant à un plan
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSubscriptions.map(sub => (
                <VehicleSubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  onRenew={handleRenew}
                  onUpgrade={handleUpgrade}
                  onCancel={handleCancel}
                  isProcessing={processingId === sub.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          {vehiclesWithoutSubscription.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tous vos véhicules sont actifs !</h3>
                <p className="text-muted-foreground">
                  Excellente nouvelle, tous vos véhicules ont un abonnement actif
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehiclesWithoutSubscription.map(vehicle => {
                const category = categories.find(c => c.id === vehicle.category_id);
                const isTruck = category?.name?.includes('Camion') || category?.name === 'Semi-Remorque';
                
                return (
                  <Card key={vehicle.id} className="border-dashed">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {isTruck ? (
                          <Truck className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Car className="h-5 w-5 text-muted-foreground" />
                        )}
                        <CardTitle className="text-base">{vehicle.name}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand} {vehicle.model} • {category?.name}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-destructive/10 rounded-lg p-3 mb-3">
                        <p className="text-sm text-destructive font-medium">
                          ⚠️ Sans abonnement - Non visible aux clients
                        </p>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => handleActivateVehicle(vehicle)}
                      >
                        Activer ce véhicule
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="mt-4">
          {expiredSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun abonnement expiré</h3>
                <p className="text-muted-foreground">
                  Vos abonnements sont tous à jour
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiredSubscriptions.map(sub => (
                <VehicleSubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  onRenew={handleRenew}
                  onUpgrade={handleUpgrade}
                  onCancel={handleCancel}
                  isProcessing={processingId === sub.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de souscription */}
      {selectedVehicle && (
        <VehicleSubscriptionModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedVehicle(null);
          }}
          vehicleId={selectedVehicle.id}
          vehicleName={`${selectedVehicle.brand} ${selectedVehicle.model}`}
          categoryName={selectedVehicle.categoryName}
          onSuccess={() => {
            toast.success('Véhicule activé avec succès !');
          }}
        />
      )}
    </div>
  );
};
