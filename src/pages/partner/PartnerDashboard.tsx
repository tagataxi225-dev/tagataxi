import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, XCircle, Mail, Phone, Building2, AlertTriangle, MessageSquare, FileText, Calendar } from 'lucide-react';

const PartnerDashboard = () => {
  const { data: partnerStatus, isLoading } = useQuery({
    queryKey: ['partner-status'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('partenaires')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Demande en cours d\'examen',
          description: 'Votre demande de partenariat est en cours d\'examen par notre équipe.'
        };
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Partenariat approuvé',
          description: 'Félicitations! Votre demande de partenariat a été approuvée.'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Demande rejetée',
          description: 'Malheureusement, votre demande n\'a pas pu être approuvée pour le moment.'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          title: 'Statut inconnu',
          description: 'Statut de la demande non reconnu.'
        };
    }
  };

  const getProgressSteps = (status: string) => {
    const steps = [
      { label: 'Demande soumise', completed: true },
      { label: 'Examen en cours', completed: status !== 'pending' },
      { label: 'Décision prise', completed: status === 'approved' || status === 'rejected' },
      { label: 'Activation du compte', completed: status === 'approved' }
    ];
    
    const completedSteps = steps.filter(step => step.completed).length;
    return { steps, progress: (completedSteps / steps.length) * 100 };
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!partnerStatus) {
    return (
      <div className="min-h-dvh bg-background p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucune demande trouvée</h3>
              <p className="text-muted-foreground mb-6">
                Vous n'avez pas encore soumis de demande de partenariat.
              </p>
              <Button onClick={() => window.location.href = '/partner/register'}>
                Faire une demande
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(partnerStatus.verification_status);
  const { steps, progress } = getProgressSteps(partnerStatus.verification_status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-dvh bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Tableau de Bord Partenaire</h1>
          <p className="text-muted-foreground">Suivez l'état de votre demande de partenariat</p>
        </div>

        <div className="space-y-6">
          {/* Statut principal */}
          <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <StatusIcon className={`h-8 w-8 ${statusInfo.color}`} />
                <div>
                  <CardTitle className={statusInfo.color}>{statusInfo.title}</CardTitle>
                  <CardDescription className="text-gray-700">
                    {statusInfo.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Barre de progression */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progression</span>
                    <span>{Math.round(progress)}% complété</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Étapes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {step.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`text-xs ${step.completed ? 'text-green-700' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Délai de traitement */}
                {partnerStatus.verification_status === 'pending' && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Délai de traitement:</strong> Nous examinerons votre dossier sous 24-48h ouvrables.
                      Vous recevrez un email de notification dès qu'une décision sera prise.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informations de la demande */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Détails de votre demande
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Entreprise</p>
                      <p className="text-sm text-gray-600">{partnerStatus.company_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">{partnerStatus.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Téléphone</p>
                      <p className="text-sm text-gray-600">{partnerStatus.phone_number}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Type d'activité</p>
                    <Badge variant="secondary">{partnerStatus.business_type}</Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Zones de service</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(partnerStatus?.service_areas || ['Kinshasa']).map((area: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">{area}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Date de demande</p>
                      <p className="text-sm text-gray-600">
                        {new Date(partnerStatus.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commentaires admin */}
          {partnerStatus?.admin_comments && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Commentaires de l'équipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-900">{partnerStatus.admin_comments}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => window.location.href = '/support/contact'}>
                  <Mail className="h-4 w-4 mr-2" />
                  Contacter le support
                </Button>
                
                {partnerStatus.verification_status === 'approved' && (
                  <Button onClick={() => window.location.href = '/partenaire'}>
                    Accéder au tableau de bord
                  </Button>
                )}
                
                {partnerStatus.verification_status === 'rejected' && (
                  <Button onClick={() => window.location.href = '/partner/register'}>
                    Faire une nouvelle demande
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Référence de dossier */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">
                <strong>Référence de dossier:</strong> {partnerStatus.id}
              </p>
              <p className="text-xs text-gray-500">
                Conservez cette référence pour toute correspondance avec notre équipe.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;