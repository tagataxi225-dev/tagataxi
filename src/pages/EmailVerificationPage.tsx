import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailVerificationPageProps {
  type: 'client' | 'driver' | 'partner' | 'restaurant';
}

export const EmailVerificationPage = ({ type }: EmailVerificationPageProps) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        console.log('📧 Email Verification - Starting for type:', type);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('📧 Session check:', { 
          hasSession: !!session, 
          error: error?.message,
          userId: session?.user?.id 
        });
        
        if (error) throw error;
        
        if (session) {
          setStatus('success');
          setMessage('Email vérifié avec succès ! Redirection...');
          
          // Redirection selon le type avec délai
          setTimeout(() => {
            const routes = {
              client: '/app/client',
              driver: '/app/chauffeur',
              partner: '/app/partenaire',
              restaurant: '/app/restaurant'
            };
            console.log('✅ Redirecting to:', routes[type]);
            navigate(routes[type]);
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Session expirée. Veuillez vous reconnecter.');
        }
      } catch (error: any) {
        console.error('❌ Email verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Erreur lors de la vérification');
      }
    };

    verifyEmail();
  }, [type, navigate]);

  const getAuthRoute = () => {
    const routes = {
      client: '/app/auth',
      driver: '/driver/auth',
      partner: '/partner/auth',
      restaurant: '/restaurant/auth'
    };
    return routes[type];
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
              <h2 className="text-2xl font-bold">Vérification en cours...</h2>
              <p className="text-muted-foreground">Veuillez patienter</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <h2 className="text-2xl font-bold text-green-600">Email vérifié !</h2>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
              <h2 className="text-2xl font-bold text-red-600">Erreur</h2>
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={() => navigate(getAuthRoute())} className="w-full">
                Retour à la connexion
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
