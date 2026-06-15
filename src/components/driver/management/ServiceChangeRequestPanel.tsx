import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useServiceChangeRequests } from '@/hooks/useServiceChangeRequests';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';
import { useDriverServiceType } from '@/hooks/useDriverServiceType';
import { SpecificServiceSelector } from '../registration/SpecificServiceSelector';
import { RefreshCw, AlertTriangle, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ServiceChangeRequestPanel: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [serviceCategory, setServiceCategory] = useState<'taxi' | 'delivery'>('taxi');
  const [reason, setReason] = useState('');

  const { serviceType: currentServiceType } = useDriverServiceType();
  const { 
    requests, 
    loading, 
    createRequest, 
    cancelRequest, 
    hasActivePendingRequest,
    isCreating 
  } = useServiceChangeRequests();
  
  const { configurations } = useServiceConfigurations();

  const handleSubmitRequest = () => {
    if (!selectedService || !currentServiceType) return;

    createRequest({
      currentServiceType: currentServiceType,
      requestedServiceType: selectedService,
      serviceCategory: serviceCategory,
      reason: reason,
    });

    // Reset form
    setSelectedService(null);
    setReason('');
    setIsDialogOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "default",
      approved: "secondary",
      rejected: "destructive",
      cancelled: "outline",
    };

    const labels = {
      pending: "En attente",
      approved: "Approuvée",
      rejected: "Rejetée",
      cancelled: "Annulée",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getCurrentServiceDisplay = () => {
    const config = configurations.find(c => c.service_type === currentServiceType);
    return config?.display_name || currentServiceType || 'Non défini';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <CardTitle>Chargement...</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service actuel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Gestion des services
          </CardTitle>
          <CardDescription>
            Gérez votre type de service et demandez des changements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Service actuel</div>
            <div className="text-lg font-semibold text-foreground">
              {getCurrentServiceDisplay()}
            </div>
          </div>

          {hasActivePendingRequest() && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vous avez une demande de changement en cours. Vous ne pouvez pas créer une nouvelle demande.
              </AlertDescription>
            </Alert>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                disabled={hasActivePendingRequest()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Demander un changement de service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Demande de changement de service</DialogTitle>
                <DialogDescription>
                  Sélectionnez le nouveau service que vous souhaitez offrir
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Sélecteur de catégorie */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Catégorie de service
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={serviceCategory === 'taxi' ? "default" : "outline"}
                      onClick={() => {
                        setServiceCategory('taxi');
                        setSelectedService(null);
                      }}
                    >
                      Taxi
                    </Button>
                    <Button
                      type="button"
                      variant={serviceCategory === 'delivery' ? "default" : "outline"}
                      onClick={() => {
                        setServiceCategory('delivery');
                        setSelectedService(null);
                      }}
                    >
                      Livraison
                    </Button>
                  </div>
                </div>

                {/* Sélecteur de service spécifique */}
                <SpecificServiceSelector
                  serviceCategory={serviceCategory}
                  selectedService={selectedService}
                  onServiceSelect={setSelectedService}
                />

                {/* Raison du changement */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Raison du changement (optionnel)
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Expliquez pourquoi vous souhaitez changer de service..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSubmitRequest}
                    disabled={!selectedService || isCreating}
                  >
                    {isCreating ? 'Envoi...' : 'Envoyer la demande'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Historique des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des demandes</CardTitle>
          <CardDescription>
            Vos demandes de changement de service passées et actuelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              Aucune demande de changement de service
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="font-medium">
                        {request.current_service_type} → {request.requested_service_type}
                      </span>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Demandé le {format(new Date(request.requested_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                  </div>

                  {request.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Raison:</span> {request.reason}
                    </div>
                  )}

                  {request.reviewer_comments && (
                    <div className="text-sm bg-muted p-2 rounded">
                      <span className="font-medium">Commentaire admin:</span> {request.reviewer_comments}
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelRequest(request.id)}
                      className="mt-2"
                    >
                      Annuler la demande
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};