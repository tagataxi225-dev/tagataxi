import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Briefcase, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PartnerRegistrationData } from '@/hooks/usePartnerRegistrationSecure';

interface ExistingUserPartnerUpgradeProps {
  email: string;
  registrationData: PartnerRegistrationData;
  onCancel: () => void;
}

export const ExistingUserPartnerUpgrade = ({ 
  email, 
  registrationData, 
  onCancel 
}: ExistingUserPartnerUpgradeProps) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddPartnerRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Se connecter avec l'utilisateur existant
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        throw new Error('Mot de passe incorrect. Veuillez réessayer.');
      }

      console.log('✅ Login successful, adding partner role to existing user:', loginData.user.id);

      // 2. Ajouter le rôle partenaire via RPC
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'add_partner_role_to_existing_user',
        {
          p_user_id: loginData.user.id,
          p_company_name: registrationData.company_name,
          p_phone_number: registrationData.phone,
          p_business_type: registrationData.business_type,
          p_service_areas: registrationData.service_areas
        }
      ) as { data: { success: boolean; error?: string; partner_id?: string } | null; error: any };

      if (rpcError || !rpcResult?.success) {
        console.error('❌ Failed to add partner role:', rpcError || rpcResult?.error);
        throw new Error(rpcResult?.error || 'Erreur lors de l\'ajout du rôle partenaire');
      }

      console.log('✅ Partner role added successfully');

      // 3. Envoyer notification admin (non-bloquant)
      try {
        await supabase.functions.invoke('smart-notification-dispatcher', {
          body: {
            type: 'partner_registration',
            data: {
              partner_name: registrationData.company_name,
              business_type: registrationData.business_type,
              service_areas: registrationData.service_areas,
              email,
              user_id: loginData.user.id,
              is_existing_user: true
            }
          }
        });
      } catch (notificationError) {
        console.warn('Admin notification failed:', notificationError);
      }

      toast.success('Rôle partenaire ajouté avec succès !', {
        description: 'Vous pouvez maintenant accéder à votre espace partenaire'
      });

      // Rediriger vers l'espace partenaire
      setTimeout(() => {
        navigate('/app/partenaire');
      }, 1000);

    } catch (error: any) {
      console.error('Error adding partner role:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible d\'ajouter le rôle partenaire'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-background dark:to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Briefcase className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Compte existant détecté</CardTitle>
                <CardDescription>Ajouter le rôle Partenaire à votre compte</CardDescription>
              </div>
            </div>

            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Un compte avec l'email <strong>{email}</strong> existe déjà. 
                Connectez-vous pour ajouter le rôle Partenaire à ce compte.
              </AlertDescription>
            </Alert>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAddPartnerRole} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="confirm-email">Email</Label>
                <Input
                  id="confirm-email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Alert className="bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/50">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                  Après connexion, vous pourrez accéder à la fois à votre espace client ET à votre espace partenaire.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500"
                >
                  {loading ? 'Connexion...' : 'Ajouter le rôle'}
                </Button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={() => navigate('/partner/auth')}
              >
                Mot de passe oublié ?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
