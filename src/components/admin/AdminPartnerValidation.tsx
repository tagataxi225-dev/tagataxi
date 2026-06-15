import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Eye, CheckCircle2, XCircle, Clock, Building2, Mail, Phone, MapPin, FileText, MessageSquare, Download } from 'lucide-react';

interface PartnerApplication {
  id: string;
  company_name: string;
  email: string;
  phone_number: string;
  address: string;
  business_type: string;
  business_license?: string;
  tax_number?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  service_areas?: string[];
  commission_rate: number;
  user_id: string;
  admin_comments?: string;
  reviewed_at?: string;
}

interface ValidationDialogProps {
  partner: PartnerApplication;
  onValidate: (id: string, status: 'approved' | 'rejected', comments?: string) => void;
  loading: boolean;
}

const ValidationDialog = ({ partner, onValidate, loading }: ValidationDialogProps) => {
  const [comments, setComments] = useState('');
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null);

  const handleValidate = () => {
    if (action) {
      onValidate(partner.id, action, comments);
      setComments('');
      setAction(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Examiner
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validation Partenaire - {partner.company_name}</DialogTitle>
          <DialogDescription>
            Examinez la demande et validez ou rejetez la candidature
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Entreprise</p>
                  <p className="text-sm text-gray-600">{partner.company_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{partner.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Téléphone</p>
                  <p className="text-sm text-gray-600">{partner.phone_number}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm font-medium">Adresse</p>
                  <p className="text-sm text-gray-600">{partner.address}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Type d'activité</p>
                <Badge variant="secondary">{partner.business_type}</Badge>
              </div>
              
               <div>
                 <p className="text-sm font-medium">Zones de service</p>
                 <div className="flex flex-wrap gap-1 mt-1">
                   {(partner.service_areas || ['Kinshasa']).map((area, index) => (
                     <Badge key={index} variant="outline" className="text-xs">{area}</Badge>
                   ))}
                 </div>
               </div>
            </div>
          </div>

          {/* Documents légaux */}
          {(partner.business_license || partner.tax_number) && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents légaux
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partner.business_license && (
                  <div>
                    <p className="text-sm font-medium">Licence d'entreprise</p>
                    <p className="text-sm text-gray-600">{partner.business_license}</p>
                  </div>
                )}
                {partner.tax_number && (
                  <div>
                    <p className="text-sm font-medium">Numéro fiscal (NIF)</p>
                    <p className="text-sm text-gray-600">{partner.tax_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commission */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Commission proposée</h4>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm"><strong>{partner.commission_rate}%</strong> sur chaque transaction</p>
            </div>
          </div>

          {/* Validation Actions */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Décision de validation</h4>
            
            <div className="flex gap-2">
              <Button
                variant={action === 'approved' ? 'default' : 'outline'}
                onClick={() => setAction('approved')}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approuver
              </Button>
              <Button
                variant={action === 'rejected' ? 'destructive' : 'outline'}
                onClick={() => setAction('rejected')}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Commentaires {action === 'rejected' ? '(obligatoire)' : '(optionnel)'}
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={action === 'approved' 
                  ? "Félicitations! Votre demande a été approuvée..."
                  : "Merci pour votre demande. Malheureusement..."
                }
                rows={3}
              />
            </div>

            {action === 'rejected' && !comments.trim() && (
              <Alert>
                <AlertDescription>
                  Veuillez fournir un commentaire expliquant le motif du rejet.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleValidate}
              disabled={loading || !action || (action === 'rejected' && !comments.trim())}
              className="w-full"
            >
              {loading ? 'Traitement...' : `Confirmer la ${action === 'approved' ? 'validation' : 'rejection'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AdminPartnerValidation = () => {
  const queryClient = useQueryClient();

  const { data: pendingPartners, isLoading } = useQuery({
    queryKey: ['pending-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partenaires')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(partner => ({
        ...partner,
        service_areas: partner.service_areas || ['Kinshasa']
      })) as PartnerApplication[];
    }
  });

  const validatePartnerMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: string; status: 'approved' | 'rejected'; comments?: string }) => {
      const { error } = await supabase
        .from('partenaires')
        .update({
          verification_status: status,
          is_active: status === 'approved',
          admin_comments: comments,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Envoyer une notification à l'edge function
      try {
        await supabase.functions.invoke('partner-validation-notification', {
          body: { 
            partner_id: id, 
            status, 
            comments,
            admin_id: (await supabase.auth.getUser()).data.user?.id
          }
        });
      } catch (notifError) {
        console.error('Erreur envoi notification:', notifError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-partners'] });
      toast.success('Partenaire validé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la validation: ' + error.message);
    }
  });

  const handleValidation = (id: string, status: 'approved' | 'rejected', comments?: string) => {
    validatePartnerMutation.mutate({ id, status, comments });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'default', icon: Clock, label: 'En attente' },
      approved: { variant: 'default', icon: CheckCircle2, label: 'Approuvé' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejeté' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Validation des Partenaires</h2>
        <p className="text-gray-600">Examinez et validez les demandes de partenariat en attente</p>
      </div>

      {!pendingPartners || pendingPartners.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande en attente</h3>
            <p className="text-gray-600">Toutes les demandes de partenariat ont été traitées.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingPartners.map((partner) => (
            <Card key={partner.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{partner.company_name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {partner.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {partner.phone_number}
                      </span>
                    </CardDescription>
                  </div>
                  {getStatusBadge(partner.verification_status)}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Type d'activité</p>
                    <p className="text-sm">{partner.business_type}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Commission</p>
                    <p className="text-sm font-medium">{partner.commission_rate}%</p>
                  </div>
                   <div>
                     <p className="text-xs font-medium text-gray-500 uppercase">Zones</p>
                     <p className="text-sm">{(partner.service_areas || ['Kinshasa']).join(', ')}</p>
                   </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Demandé le</p>
                    <p className="text-sm">{new Date(partner.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <ValidationDialog
                    partner={partner}
                    onValidate={handleValidation}
                    loading={validatePartnerMutation.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPartnerValidation;