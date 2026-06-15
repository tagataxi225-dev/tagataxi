import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TouchOptimizedButton } from '@/components/ui/touch-optimized';
import { useAuth } from '@/hooks/useAuth';
import { useUserVerification } from '@/hooks/useUserVerification';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  CreditCard, 
  Store,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { VendorVerificationFlow } from '@/components/marketplace/VendorVerificationFlow';

interface VerificationRequest {
  id: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  submitted_at: string;
  reviewed_by?: string;
}

export const VendorVerificationDashboard = () => {
  const { user } = useAuth();
  const { verification, loading: verificationLoading } = useUserVerification();
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVerificationFlow, setShowVerificationFlow] = useState(false);

  useEffect(() => {
    loadVerificationStatus();
  }, [user]);

  const loadVerificationStatus = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading verification:', error);
      }

      if (data) {
        setVerificationRequest({
          id: data.id,
          verification_status: data.verification_status as 'pending' | 'approved' | 'rejected',
          rejection_reason: data.rejection_reason || undefined,
          submitted_at: data.created_at,
          reviewed_by: data.reviewed_by || undefined
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!verificationRequest) {
      return <Badge variant="secondary">Non vérifié</Badge>;
    }

    switch (verificationRequest.verification_status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Vérifié</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Refusé</Badge>;
      default:
        return <Badge variant="secondary">Non vérifié</Badge>;
    }
  };

  const getProgressValue = () => {
    if (!verificationRequest) return 0;
    
    switch (verificationRequest.verification_status) {
      case 'pending':
        return 60;
      case 'approved':
        return 100;
      case 'rejected':
        return 30;
      default:
        return 0;
    }
  };

  const getVerificationSteps = () => {
    const allCompleted = verificationRequest?.verification_status === 'approved';
    const hasSubmitted = !!verificationRequest;

    return [
      {
        icon: Store,
        title: 'Informations boutique',
        completed: hasSubmitted || allCompleted,
        description: 'Nom, type et détails de votre entreprise'
      },
      {
        icon: FileText,
        title: 'Documents d\'identité',
        completed: hasSubmitted || allCompleted,
        description: 'Pièce d\'identité et justificatif de domicile'
      },
      {
        icon: CreditCard,
        title: 'Informations de paiement',
        completed: hasSubmitted || allCompleted,
        description: 'Compte Mobile Money ou bancaire'
      }
    ];
  };

  if (loading || verificationLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (showVerificationFlow) {
    return (
      <VendorVerificationFlow
        onSuccess={() => {
          setShowVerificationFlow(false);
          loadVerificationStatus();
        }}
        onCancel={() => setShowVerificationFlow(false)}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Shield className="h-6 w-6 text-primary" />
                Vérification Vendeur
              </CardTitle>
              <CardDescription>
                Faites vérifier votre profil pour vendre sans limitation
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{getProgressValue()}%</span>
            </div>
            <Progress value={getProgressValue()} className="h-2" />
          </div>

          {/* Status Messages */}
          {!verificationRequest && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Votre profil n'est pas encore vérifié. Complétez la vérification pour vendre sans limitation.
              </AlertDescription>
            </Alert>
          )}

          {verificationRequest?.verification_status === 'pending' && (
            <Alert className="bg-blue-50 border-blue-200">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Votre demande est en cours de vérification. Vous recevrez une réponse sous 24-48h.
              </AlertDescription>
            </Alert>
          )}

          {verificationRequest?.verification_status === 'approved' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                🎉 Félicitations ! Votre profil est vérifié. Vous pouvez maintenant vendre sans limitation.
              </AlertDescription>
            </Alert>
          )}

          {verificationRequest?.verification_status === 'rejected' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Demande refusée : {verificationRequest.rejection_reason || 'Raison non spécifiée'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Steps Card */}
      <Card>
        <CardHeader>
          <CardTitle>Étapes de vérification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getVerificationSteps().map((step, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  step.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-muted/30 border-muted'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center">
        {!verificationRequest && (
          <TouchOptimizedButton
            size="lg"
            onClick={() => setShowVerificationFlow(true)}
            className="w-full max-w-md"
          >
            <Shield className="mr-2 h-5 w-5" />
            Commencer la vérification
          </TouchOptimizedButton>
        )}

        {verificationRequest?.verification_status === 'rejected' && (
          <TouchOptimizedButton
            size="lg"
            onClick={() => setShowVerificationFlow(true)}
            className="w-full max-w-md"
          >
            Renvoyer ma demande
          </TouchOptimizedButton>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Pourquoi se faire vérifier ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✅ Vendre sans limitation de produits</p>
          <p>✅ Augmenter la confiance des acheteurs</p>
          <p>✅ Recevoir un badge "Vendeur Vérifié"</p>
          <p>✅ Accéder aux outils marketing avancés</p>
          <p>✅ Traitement prioritaire des commandes</p>
        </CardContent>
      </Card>
    </div>
  );
};
