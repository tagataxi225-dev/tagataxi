import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ShieldCheck, Upload, Store } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const VendorVerificationRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'verified'>('idle');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user) return;

    try {
      // Vérifier si l'utilisateur a un profil de vérification
      const { data: verification } = await supabase
        .from('user_verification')
        .select('verification_level, phone_verified, identity_verified')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (verification) {
        setPhoneVerified(verification.phone_verified || false);
        setIdentityVerified(verification.identity_verified || false);
        
        if (verification.identity_verified) {
          setVerificationStatus('verified');
        } else if (verification.phone_verified) {
          setVerificationStatus('pending');
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const requestVendorAccess = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 1. Vérifier le niveau de vérification
      const { data: verification, error: verifyError } = await supabase
        .from('user_verification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!verification?.phone_verified) {
        toast.error('Vérification requise', {
          description: 'Veuillez vérifier votre numéro de téléphone d\'abord'
        });
        return;
      }

      if (!verification?.identity_verified) {
        toast.error('Vérification d\'identité requise', {
          description: 'Veuillez soumettre vos documents d\'identité'
        });
        // Rediriger vers upload de documents
        navigate('/verification/identity');
        return;
      }

      // 2. Créer le rôle vendeur
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'vendor',
          is_active: true
        });

      if (roleError) {
        // Si le rôle existe déjà, ce n'est pas une erreur critique
        if (!roleError.message.includes('duplicate')) {
          throw roleError;
        }
      }

      // 3. Créer le profil vendeur
      const { error: vendorError } = await supabase
        .from('vendor_profiles')
        .insert({
          user_id: user.id,
          shop_name: `Boutique ${user.email?.split('@')[0] || 'Vendeur'}`,
          is_verified: false, // En attente de modération admin
          status: 'pending'
        });

      if (vendorError) {
        // Si le profil existe déjà
        if (vendorError.message.includes('duplicate')) {
          toast.info('Profil vendeur existant', {
            description: 'Vous avez déjà un profil vendeur'
          });
          setTimeout(() => {
            window.location.href = '/vendeur';
          }, 1500);
          return;
        }
        throw vendorError;
      }

      toast.success('Demande envoyée !', {
        description: 'Votre demande de vendeur est en cours de traitement'
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('Error requesting vendor access:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de soumettre la demande'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          Devenir vendeur sur TAGA
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Prérequis */}
        <Alert>
          <ShieldCheck className="h-5 w-5" />
          <AlertDescription>
            <strong>Prérequis pour vendre :</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li className={phoneVerified ? "text-green-600" : ""}>
                {phoneVerified ? "✅" : "❌"} Numéro de téléphone confirmé
              </li>
              <li className={identityVerified ? "text-green-600" : ""}>
                {identityVerified ? "✅" : "❌"} Pièce d'identité validée
              </li>
              <li>✅ Compte TAGA vérifié</li>
              <li>✅ Conditions générales acceptées</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Status actuel */}
        {verificationStatus === 'verified' ? (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Votre profil est vérifié ! Vous pouvez maintenant créer votre espace vendeur.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Veuillez compléter la vérification de votre identité avant de devenir vendeur.
            </AlertDescription>
          </Alert>
        )}

        {/* Bouton d'action */}
        <div className="flex flex-col gap-3">
          {verificationStatus !== 'verified' ? (
            <Button 
              variant="outline"
              onClick={() => navigate('/verification/identity')}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Vérifier mon identité
            </Button>
          ) : (
            <Button 
              onClick={requestVendorAccess}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-glow"
            >
              {loading ? 'Création en cours...' : 'Créer mon espace vendeur'}
            </Button>
          )}

          <Button variant="ghost" onClick={() => window.history.back()}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
