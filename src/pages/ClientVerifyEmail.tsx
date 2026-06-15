import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const ClientVerifyEmail = () => {
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const checkEmailConfirmation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setCompleting(true);
        
        const { data: client, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (client && !error) {
          setVerified(true);
          toast.success('Email confirmé avec succès !');
          
          setTimeout(() => {
            navigate('/client');
          }, 2000);
        } else {
          console.error('Client profile not found:', error);
          setCompleting(false);
        }
      }
    };
    
    checkEmailConfirmation();
  }, [navigate]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email
        });
        
        if (error) throw error;
        
        toast.success('Email de confirmation renvoyé !');
      }
    } catch (error: any) {
      toast.error('Erreur lors du renvoi de l\'email');
      console.error(error);
    } finally {
      setResending(false);
    }
  };

  if (completing || verified) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4 pt-safe-top">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center space-y-4">
            {verified ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
                <h2 className="text-2xl font-bold text-green-700">Email confirmé !</h2>
                <p className="text-muted-foreground">Redirection vers votre espace client...</p>
              </>
            ) : (
              <>
                <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Vérification en cours...</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 pt-safe-top">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
          <CardDescription className="text-base">
            Nous avons envoyé un email de confirmation à votre adresse
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-accent/50 border border-border rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Instructions :</strong>
              </p>
              <ol className="text-sm text-muted-foreground mt-2 ml-4 list-decimal space-y-1">
                <li>Ouvrez votre boîte email</li>
                <li>Cliquez sur le lien de confirmation</li>
                <li>Vous serez automatiquement redirigé</li>
              </ol>
            </div>

            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas reçu l'email ?
              </p>
              <Button
                onClick={handleResendEmail}
                disabled={resending}
                variant="outline"
                className="w-full"
              >
                {resending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {resending ? 'Envoi en cours...' : 'Renvoyer l\'email'}
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la connexion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientVerifyEmail;
