import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Car, CheckCircle, XCircle, Eye, Calendar, Phone, Mail } from 'lucide-react';

interface DriverRequest {
  id: string;
  user_id: string;
  license_number: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string;
  vehicle_type: string;
  insurance_number: string;
  license_expiry: string;
  service_type?: string;
  status: string;
  created_at: string;
  updated_at: string;
  validation_level?: string;
  rejected_reason?: string;
  approved_at?: string;
  validation_comments?: string;
  validated_by?: string;
  validation_date?: string;
  documents?: any;
  partner_id?: string;
}

export const AdminDriverModeration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<DriverRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['admin-driver-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request) throw new Error('Demande non trouvée');

      // Create driver profile
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .insert({
          user_id: request.user_id,
          license_number: request.license_number,
          vehicle_make: 'Non spécifié',
          vehicle_model: request.vehicle_model,
          vehicle_year: request.vehicle_year,
          vehicle_plate: request.vehicle_plate,
          insurance_number: request.insurance_number,
          license_expiry: request.license_expiry,
          insurance_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          vehicle_class: 'standard',
          service_type: request.service_type || 'taxi',
          verification_status: 'verified',
          is_active: true,
          vehicle_color: 'Non spécifié'
        });

      if (profileError) throw profileError;

      // Update request status
      const { error: updateError } = await supabase
        .from('driver_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Assign driver role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: request.user_id,
          role: 'driver',
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          is_active: true
        });

      if (roleError && !roleError.message.includes('duplicate key')) {
        throw roleError;
      }

      return { requestId };
    },
    onSuccess: () => {
      toast({
        title: "Demande approuvée",
        description: "Le chauffeur a été approuvé et son profil a été créé.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-driver-requests'] });
    },
    onError: (error) => {
      console.error('Approval error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la demande.",
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { error } = await supabase
        .from('driver_requests')
        .update({ 
          status: 'rejected',
          rejected_reason: reason
        })
        .eq('id', requestId);

      if (error) throw error;
      return { requestId };
    },
    onSuccess: () => {
      toast({
        title: "Demande rejetée",
        description: "La demande de chauffeur a été rejetée.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-driver-requests'] });
      setRejectionReason('');
      setSelectedRequest(null);
    },
    onError: (error) => {
      console.error('Rejection error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la demande.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Modération des Chauffeurs</h2>
          <p className="text-muted-foreground">
            Approuvez ou rejetez les demandes d'inscription des chauffeurs
          </p>
        </div>
        <Badge variant="secondary">{pendingRequests.length} en attente</Badge>
      </div>

      {pendingRequests.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Aucune demande en attente</p>
              <p className="text-muted-foreground">Toutes les demandes ont été traitées.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    <span className="truncate">
                      Chauffeur #{request.license_number}
                    </span>
                  </div>
                  <Badge variant="outline">En attente</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{request.user_id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>Non renseigné</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <p className="font-medium">{request.vehicle_model} ({request.vehicle_type})</p>
                  <p className="text-sm text-muted-foreground">Année: {request.vehicle_year}</p>
                  <p className="text-sm text-muted-foreground">Plaque: {request.vehicle_plate}</p>
                  <p className="text-sm text-muted-foreground">Permis: {request.license_number}</p>
                  <p className="text-sm text-muted-foreground">
                    Expiration: {new Date(request.license_expiry).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Détails de la demande</DialogTitle>
                      </DialogHeader>
                      {selectedRequest && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Informations personnelles</h4>
                              <div className="space-y-1 text-sm">
                              <p><strong>Nom:</strong> N/A</p>
                              <p><strong>Téléphone:</strong> N/A</p>
                                <p><strong>ID:</strong> {selectedRequest.user_id}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Véhicule</h4>
                              <div className="space-y-1 text-sm">
                                <p><strong>Type:</strong> {selectedRequest.vehicle_type}</p>
                                <p><strong>Modèle:</strong> {selectedRequest.vehicle_model}</p>
                                <p><strong>Année:</strong> {selectedRequest.vehicle_year}</p>
                                <p><strong>Plaque:</strong> {selectedRequest.vehicle_plate}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Documents</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Permis:</strong> {selectedRequest.license_number}</p>
                              <p><strong>Expiration permis:</strong> {new Date(selectedRequest.license_expiry).toLocaleDateString('fr-FR')}</p>
                              <p><strong>Assurance:</strong> {selectedRequest.insurance_number}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              variant="destructive" 
                              className="flex-1"
                              onClick={() => {
                                setRejectionReason('Documents insuffisants ou incorrects');
                              }}
                            >
                              Rejeter
                            </Button>
                            <Button 
                              className="flex-1"
                              onClick={() => approveMutation.mutate(selectedRequest.id)}
                              disabled={approveMutation.isPending}
                            >
                              Approuver
                            </Button>
                          </div>

                          {rejectionReason && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Raison du rejet</label>
                              <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Expliquez pourquoi cette demande est rejetée..."
                              />
                              <Button 
                                variant="destructive"
                                onClick={() => rejectMutation.mutate({ 
                                  requestId: selectedRequest.id, 
                                  reason: rejectionReason 
                                })}
                                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                              >
                                Confirmer le rejet
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(request.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};