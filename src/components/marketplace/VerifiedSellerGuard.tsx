import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserVerification } from '@/hooks/useUserVerification';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Phone, FileText, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { VendorVerificationFlow } from './VendorVerificationFlow';

interface VerifiedSellerGuardProps {
  children: React.ReactNode;
}

interface DiagnosticInfo {
  blocking_reasons?: string[];
  verification_record?: any;
  seller_profile?: any;
  can_sell?: boolean;
}

export const VerifiedSellerGuard: React.FC<VerifiedSellerGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const { verification, loading, isVerifiedForSelling, getVerificationProgress } = useUserVerification();
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null);

  // Lancer le diagnostic au chargement
  useEffect(() => {
    const runDiagnostic = async () => {
      if (!verification?.user_id) return;
      
      const { data, error } = await supabase.rpc('diagnose_seller_status', {
        p_user_id: verification.user_id
      });
      
      if (!error && data) {
        setDiagnostic(data as DiagnosticInfo);
        console.log('🔍 Diagnostic vendeur:', data);
      }
    };
    
    if (!loading && !isVerifiedForSelling()) {
      runDiagnostic();
    }
  }, [verification, loading, isVerifiedForSelling]);

  const [showVerificationFlow, setShowVerificationFlow] = useState(false);

  const handleStartVerification = async () => {
    // Vérifier d'abord si une demande existe déjà
    const { data: existingRequest } = await supabase
      .from('seller_verification_requests')
      .select('*')
      .eq('user_id', verification?.user_id)
      .single();
    
    if (existingRequest) {
      if (existingRequest.verification_status === 'pending') {
        alert('Votre demande de vérification est en cours de traitement. Vous recevrez une réponse sous 24-48h.');
        return;
      }
      if (existingRequest.verification_status === 'rejected') {
        alert(`Votre demande a été rejetée: ${existingRequest.rejection_reason || 'Raison non spécifiée'}. Vous pouvez soumettre une nouvelle demande.`);
      }
    }
    
    setShowVerificationFlow(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Afficher le flux de vérification si demandé
  if (showVerificationFlow) {
    return (
      <VendorVerificationFlow 
        onSuccess={() => {
          setShowVerificationFlow(false);
          alert('✅ Demande envoyée ! Vous recevrez une réponse sous 24-48h.');
        }}
        onCancel={() => setShowVerificationFlow(false)}
      />
    );
  }

  if (isVerifiedForSelling()) {
    return <>{children}</>;
  }

  const progress = getVerificationProgress();

  // Afficher les raisons de blocage détaillées
  const renderBlockingReasons = () => {
    if (!diagnostic?.blocking_reasons || diagnostic.blocking_reasons.length === 0) {
      return null;
    }

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">🚫 Raisons du blocage:</p>
          <ul className="list-disc list-inside space-y-1">
            {diagnostic.blocking_reasons.map((reason, idx) => (
              <li key={idx} className="text-sm">{reason}</li>
            ))}
          </ul>
          {diagnostic.verification_record && (
            <div className="mt-3 p-2 bg-muted rounded text-xs font-mono">
              <p>Debug: Status = {diagnostic.verification_record.verification_status || 'null'}</p>
              <p>Debug: Level = {diagnostic.verification_record.verification_level || 'null'}</p>
              <p>Debug: Phone verified = {diagnostic.verification_record.phone_verified ? 'true' : 'false'}</p>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-orange-500/30 bg-orange-500/10 dark:border-orange-400/30 dark:bg-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Shield className="w-5 h-5" />
            Vérification de compte requise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Raisons de blocage détaillées */}
          {renderBlockingReasons()}

          <p className="text-orange-700 dark:text-orange-300">
            Pour vendre sur notre marketplace, vous devez vérifier votre compte. 
            {verification?.verification_status === 'pending_review' ? (
              <strong className="block mt-2">Votre demande est en cours de révision par notre équipe.</strong>
            ) : verification?.verification_status === 'approved' ? (
              <strong className="block mt-2 text-green-600">✅ Votre compte est approuvé mais la synchronisation est en cours...</strong>
            ) : (
              'Cela garantit la sécurité et la confiance de tous nos utilisateurs.'
            )}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Progression de la vérification</span>
              <Badge variant={progress === 100 ? "default" : "secondary"}>
                {progress}%
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Étapes de vérification :</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                {verification?.phone_verified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Phone className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">Vérification du téléphone</p>
                  <p className="text-xs text-muted-foreground">
                    Confirmez votre numéro de téléphone par SMS
                  </p>
                </div>
                <Badge variant={verification?.phone_verified ? "default" : "secondary"}>
                  {verification?.phone_verified ? "Vérifié" : "En attente"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                {verification?.identity_verified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <FileText className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">Vérification d'identité</p>
                  <p className="text-xs text-muted-foreground">
                    Uploadez une pièce d'identité valide
                  </p>
                </div>
                <Badge variant={verification?.identity_verified ? "default" : "secondary"}>
                  {verification?.identity_verified ? "Vérifié" : "En attente"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            {verification?.verification_status === 'pending_review' ? (
              <div className="text-center space-y-2">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                  En attente de validation admin
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Votre compte sera activé dans les 24-48 heures
                </p>
              </div>
            ) : verification?.verification_status === 'rejected' ? (
              <div className="text-center space-y-2">
                <Badge variant="destructive">
                  Vérification rejetée
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Contactez le support pour plus d'informations
                </p>
              </div>
            ) : verification?.verification_status === 'approved' ? (
              <div className="text-center space-y-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                  ✅ Approuvé - Synchronisation en cours
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Rechargez la page dans quelques instants
                </p>
                <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
                  Recharger la page
                </Button>
              </div>
            ) : (
              <>
                <Button className="w-full" onClick={handleStartVerification}>
                  <Shield className="w-4 h-4 mr-2" />
                  Commencer la vérification
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  La vérification prend généralement 24-48 heures
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500/30 bg-blue-500/10 dark:border-blue-400/30 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Pourquoi vérifier mon compte ?</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Protection contre la fraude</li>
                <li>• Accès à toutes les fonctionnalités de vente</li>
                <li>• Badge de vendeur vérifié</li>
                <li>• Confiance accrue des acheteurs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
