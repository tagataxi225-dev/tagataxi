import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useRealTimeDeliveryTracking } from '@/hooks/useRealTimeDeliveryTracking';
import { useMarketplaceOrderTracking } from '@/hooks/useMarketplaceOrderTracking';
import UniversalTracker from '@/components/tracking/UniversalTracker';
import DriverDeliveryDashboard from '@/components/driver/DriverDeliveryDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface UnifiedDeliveryInterfaceProps {
  orderId: string;
  onBack?: () => void;
}

export default function UnifiedDeliveryInterface({ orderId, onBack }: UnifiedDeliveryInterfaceProps) {
  const { userRole } = useUserRole();
  const [orderType, setOrderType] = useState<'delivery' | 'marketplace' | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  
  // Détecter le type de commande
  useEffect(() => {
    const detectOrderType = async () => {
      try {
        console.log('🔍 Détection du type de commande:', orderId);
        
        // Vérifier d'abord delivery_orders
        const { data: deliveryOrder } = await supabase
          .from('delivery_orders')
          .select('id')
          .eq('id', orderId)
          .maybeSingle();
          
        if (deliveryOrder) {
          console.log('✅ Type détecté: delivery_orders');
          setOrderType('delivery');
          setIsDetecting(false);
          return;
        }
        
        // Sinon, vérifier marketplace_orders
        const { data: marketplaceOrder } = await supabase
          .from('marketplace_orders')
          .select('id')
          .eq('id', orderId)
          .maybeSingle();
          
        if (marketplaceOrder) {
          console.log('✅ Type détecté: marketplace_orders');
          setOrderType('marketplace');
          setIsDetecting(false);
          return;
        }
        
        console.error('❌ Commande non trouvée dans aucune table');
        setOrderType(null);
        setIsDetecting(false);
      } catch (error) {
        console.error('❌ Erreur détection type:', error);
        setOrderType(null);
        setIsDetecting(false);
      }
    };
    
    detectOrderType();
  }, [orderId]);
  
  // Utiliser le hook approprié selon le type
  const deliveryTracking = useRealTimeDeliveryTracking({
    orderId,
    enableDriverTracking: orderType === 'delivery',
    enableChat: orderType === 'delivery'
  });

  const marketplaceTracking = useMarketplaceOrderTracking({
    orderId,
    enableTracking: orderType === 'marketplace'
  });

  // Sélectionner les données appropriées
  const trackingData = orderType === 'delivery' ? deliveryTracking.trackingData : marketplaceTracking.trackingData;
  const loading = orderType === 'delivery' ? deliveryTracking.loading : marketplaceTracking.loading;
  const error = orderType === 'delivery' ? deliveryTracking.error : marketplaceTracking.error;
  const connectionStatus = orderType === 'delivery' ? deliveryTracking.connectionStatus : marketplaceTracking.connectionStatus;
  const refreshTracking = orderType === 'delivery' ? deliveryTracking.refreshTracking : marketplaceTracking.refreshTracking;

  // Interface pour chauffeurs - Dashboard complet
  if (userRole === 'chauffeur') {
    return (
      <DriverDeliveryDashboard 
        onSelectDelivery={(deliveryId) => {
          console.log('Livraison sélectionnée:', deliveryId);
        }}
      />
    );
  }

  // État de détection du type
  if (isDetecting || orderType === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Détection du type de commande...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
            <div className="w-24 h-6 bg-muted rounded animate-pulse" />
          </div>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="w-32 h-8 bg-muted rounded animate-pulse" />
              <div className="w-full h-2 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    const isNotFoundError = error.includes('non trouv') || error.includes('introuvable') || error.includes('non detect');
    
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Bouton retour */}
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          
          <Card className="border border-border/40 shadow-lg bg-card">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  {isNotFoundError ? 'Commande introuvable' : 'Erreur de connexion'}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {isNotFoundError 
                    ? 'Cette commande a peut-être été annulée ou n\'existe plus.'
                    : 'Impossible de charger les données. Vérifiez votre connexion.'
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                {!isNotFoundError && (
                  <Button onClick={refreshTracking} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer
                  </Button>
                )}
                {onBack && (
                  <Button variant="outline" onClick={onBack} className="w-full">
                    Retour à l'activité
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Interface pour clients - Tracker universel avec données temps réel
  return (
    <UniversalTracker 
      orderId={orderId}
      orderType={orderType || undefined}
      onBack={onBack}
      showMap={true}
      showChat={true}
    />
  );
}