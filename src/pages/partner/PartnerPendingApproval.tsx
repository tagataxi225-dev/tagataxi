import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Mail, Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PartnerPendingApproval = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const { data: partner } = useQuery({
    queryKey: ['partner-status', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('partenaires')
        .select('company_name, verification_status, admin_comments, created_at')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/partner/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Clock className="h-6 w-6 text-orange-600 animate-pulse" />
              Demande en cours de traitement
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertDescription className="text-base space-y-3">
              <p className="font-semibold text-lg">
                Bonjour {partner?.company_name || 'Partenaire'},
              </p>
              <p>
                Votre demande de partenariat est actuellement en cours d'examen par notre équipe.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[140px]">⏱️ Délai habituel:</span>
                  <span>24-48 heures ouvrables</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[140px]">📅 Demande soumise:</span>
                  <span>
                    {partner?.created_at 
                      ? format(new Date(partner.created_at), 'd MMMM yyyy', { locale: fr })
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[140px]">📊 Statut actuel:</span>
                  <span className="capitalize">
                    {partner?.verification_status === 'pending' && '🟡 En attente de validation'}
                    {partner?.verification_status === 'approved' && '✅ Approuvé'}
                    {partner?.verification_status === 'rejected' && '❌ Rejeté'}
                    {!partner?.verification_status && 'Non disponible'}
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {partner?.admin_comments && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <AlertDescription>
                <p className="font-semibold mb-2">💬 Commentaire de l'équipe:</p>
                <p className="text-sm">{partner.admin_comments}</p>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <p className="font-medium text-base">Besoin d'aide ?</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:partners@kwenda.cd" className="hover:text-primary underline">
                  partners@kwenda.cd
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+243999123456" className="hover:text-primary">
                  +243 999 123 456
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Vous recevrez une notification par email dès que votre demande sera traitée.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerPendingApproval;
