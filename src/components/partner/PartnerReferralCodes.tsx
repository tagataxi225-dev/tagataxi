import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Package, Truck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface FleetStats {
  totalDrivers: number;
  deliveryDrivers: number;
  truckDrivers: number;
}

export const PartnerReferralCodes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<FleetStats>({
    totalDrivers: 0,
    deliveryDrivers: 0,
    truckDrivers: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadFleetStats();
    }
  }, [user?.id]);

  const loadFleetStats = async () => {
    const { data: drivers } = await supabase
      .from('partner_drivers')
      .select('id, driver_id, status')
      .eq('partner_id', user?.id)
      .eq('status', 'active');

    if (drivers) {
      setStats({
        totalDrivers: drivers.length,
        deliveryDrivers: Math.floor(drivers.length * 0.6), // Approximate for now
        truckDrivers: Math.floor(drivers.length * 0.4)
      });
    }
  };

  const statCards = [
    { icon: Users, label: 'Total chauffeurs', value: stats.totalDrivers, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Package, label: 'Livreurs', value: stats.deliveryDrivers, color: 'text-green-500', bg: 'bg-green-50' },
    { icon: Truck, label: 'Camions', value: stats.truckDrivers, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Information Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800">Gestion de Flotte</h3>
              <p className="text-sm text-amber-700 mt-1">
                Les partenaires n'ont plus de code de parrainage. Pour ajouter des chauffeurs à votre flotte, 
                demandez-leur leur <strong>Code Driver</strong> et ajoutez-les via l'onglet "Livreurs" ou "Camions".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Statistics */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Action Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="text-lg">Ajouter des chauffeurs</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Pour ajouter un chauffeur à votre flotte :
          </p>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Demandez au chauffeur son <strong>Code Driver</strong></li>
            <li>Accédez à l'onglet "Livreurs" ou "Camions"</li>
            <li>Entrez le code et validez</li>
          </ol>
          
          <Button 
            className="w-full mt-4"
            onClick={() => navigate('/partner/fleet')}
          >
            Gérer ma flotte
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* How Code Driver Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comment fonctionne le Code Driver ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Le chauffeur génère son code</p>
              <p className="text-sm text-muted-foreground">
                Chaque chauffeur (livreur ou camionneur) possède un Code Driver unique dans son application
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Vous ajoutez le chauffeur</p>
              <p className="text-sm text-muted-foreground">
                Entrez son code dans votre espace partenaire pour l'ajouter à votre flotte
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">Exclusivité garantie</p>
              <p className="text-sm text-muted-foreground">
                Un chauffeur ne peut appartenir qu'à une seule flotte à la fois. 
                Il doit quitter sa flotte actuelle avant d'en rejoindre une autre.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
