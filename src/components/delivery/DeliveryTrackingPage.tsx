import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { useDeliveryStatusHistory } from '@/hooks/useDeliveryStatusHistory';
import { toast } from 'sonner';
import { 
  Search, 
  Package, 
  MapPin, 
  Clock, 
  Phone, 
  User,
  CheckCircle2,
  AlertCircle,
  Truck,
  Navigation2
} from 'lucide-react';

const DeliveryTrackingPage = () => {
  const [trackingId, setTrackingId] = useState('');
  const [searchedId, setSearchedId] = useState('');
  
  const { 
    order, 
    driverProfile, 
    recipientProfile, 
    driverLocation, 
    loading: trackingLoading,
    statusLabel,
    packageType,
    price
  } = useDeliveryTracking(searchedId);

  const {
    statusHistory,
    loading: historyLoading,
    getStatusLabel,
    getStatusColor,
    formatDate,
    getCurrentStatus,
    getProgressPercentage
  } = useDeliveryStatusHistory(searchedId);

  const handleSearch = () => {
    if (!trackingId.trim()) {
      toast.error('Veuillez entrer un ID de livraison');
      return;
    }

    // Validation format flexible pour compatibilité
    const trimmedId = trackingId.trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmedId);
    const isLegacyFormat = /^KWT[A-Z0-9]{6}$/i.test(trimmedId);
    
    if (!isUUID && !isLegacyFormat) {
      toast.error('Format d\'ID invalide. Utilisez un ID UUID ou format KWT (ex: KWTABC123).');
      return;
    }

    setSearchedId(trackingId.trim());
  };

  const handleReset = () => {
    setTrackingId('');
    setSearchedId('');
  };

  const currentStatus = getCurrentStatus();
  const progressPercentage = currentStatus ? getProgressPercentage(currentStatus.status) : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Suivi de Livraison</h1>
        <p className="text-muted-foreground">
          Suivez votre colis en temps réel avec son ID de livraison
        </p>
      </div>

      {/* Recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Rechercher une Livraison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="trackingId">ID de Livraison</Label>
              <Input
                id="trackingId"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Entrez l'ID UUID de votre livraison..."
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleSearch} 
              disabled={trackingLoading || !trackingId.trim()}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
            {searchedId && (
              <Button variant="outline" onClick={handleReset}>
                Nouvelle Recherche
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Résultats de recherche */}
      {searchedId && (
        <>
          {trackingLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p>Recherche en cours...</p>
                </div>
              </CardContent>
            </Card>
          ) : order ? (
            <div className="space-y-6">
              {/* Informations principales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {packageType}
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {statusLabel}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-1" />
                        <div>
                          <p className="font-medium">Point de collecte</p>
                          <p className="text-sm text-muted-foreground">
                            {order.pickup_location}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Navigation2 className="h-4 w-4 text-primary mt-1" />
                        <div>
                          <p className="font-medium">Destination</p>
                          <p className="text-sm text-muted-foreground">
                            {order.delivery_location}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Prix</p>
                      <p className="font-bold">{price.toLocaleString()} CDF</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Créé le</p>
                      <p className="font-medium">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progression */}
              <Card>
                <CardHeader>
                  <CardTitle>Progression de la Livraison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Progression</span>
                      <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="w-full" />
                  </div>
                </CardContent>
              </Card>

              {/* Historique des statuts */}
              {statusHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Historique de Livraison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statusHistory.map((entry, index) => (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(entry.status)} bg-current`}></div>
                            {index < statusHistory.length - 1 && (
                              <div className="absolute top-3 left-1.5 w-0.5 h-6 bg-border"></div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{getStatusLabel(entry.status)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(entry.changed_at)}
                              </p>
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Informations du chauffeur */}
              {driverProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Chauffeur Assigné
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {driverProfile.display_name || 'Chauffeur Tembea'}
                        </p>
                        {driverProfile.phone_number && (
                          <Button variant="outline" size="sm" className="mt-2">
                            <Phone className="h-4 w-4 mr-2" />
                            Appeler
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="font-medium">Livraison non trouvée</h3>
                  <p className="text-sm text-muted-foreground">
                    Aucune livraison trouvée avec cet ID. Vérifiez l'ID et réessayez.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default DeliveryTrackingPage;