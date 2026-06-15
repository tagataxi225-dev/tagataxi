import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { SuccessConfetti } from '@/components/wallet/SuccessConfetti';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const transactionId = searchParams.get('tx');
  const urlStatus = searchParams.get('status');
  
  const [status, setStatus] = useState<'processing' | 'success' | 'failed' | 'expired' | 'cancelled'>('processing');
  const [transaction, setTransaction] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!transactionId) {
      toast.error('Transaction non trouvée');
      // Rediriger vers le dashboard approprié
      const userType = localStorage.getItem('kwenda_selected_role') || 'client';
      const dashboardPaths: Record<string, string> = {
        driver: '/app/chauffeur',
        partner: '/app/partenaire',
        admin: '/operatorx/admin',
        restaurant: '/app/restaurant',
        client: '/app/client'
      };
      navigate(dashboardPaths[userType] || '/app/client', { replace: true });
      return;
    }

    // Si URL indique déjà un statut final
    if (urlStatus === 'cancelled') {
      setStatus('cancelled');
      return;
    }

    // Polling du statut toutes les 3 secondes
    const pollStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('transaction_id', transactionId)
          .single();

        if (error) throw error;

        setTransaction(data);

        if (data.status === 'completed') {
          setStatus('success');
          setShowConfetti(true);
          toast.success('Paiement réussi !');
          return true; // Stop polling
        } else if (data.status === 'failed') {
          setStatus('failed');
          toast.error('Le paiement a échoué');
          return true; // Stop polling
        } else if (data.status === 'expired') {
          setStatus('expired');
          toast.error('Le paiement a expiré');
          return true; // Stop polling
        }

        return false; // Continue polling
      } catch (error) {
        console.error('Error checking payment status:', error);
        return false;
      }
    };

    // Premier check immédiat
    pollStatus().then(shouldStop => {
      if (shouldStop) return;

      // Continuer le polling
      const interval = setInterval(async () => {
        const shouldStop = await pollStatus();
        if (shouldStop) {
          clearInterval(interval);
        }
      }, 3000);

      // Timeout après 5 minutes
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setStatus('expired');
        toast.error('Délai d\'attente dépassé');
      }, 5 * 60 * 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    });
  }, [transactionId, urlStatus, navigate]);

  // Countdown pour redirection automatique
  useEffect(() => {
    if (status === 'success') {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            redirectToDashboard();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status]);

  const redirectToDashboard = () => {
    const userType = transaction?.metadata?.userType || 'client';
    
    switch (userType) {
      case 'partner':
        navigate('/partner');
        break;
      case 'vendor':
        navigate('/marketplace/vendor');
        break;
      case 'restaurant':
        navigate('/restaurant/dashboard');
        break;
      default:
        navigate('/client');
    }
  };

  const handleRetry = () => {
    redirectToDashboard();
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: currency || 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-primary/50" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Vérification en cours...
                </h2>
                <p className="text-muted-foreground">
                  Nous vérifions votre paiement Orange Money.
                  <br />
                  Cela peut prendre quelques instants.
                </p>
              </div>

              {transaction && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant:</span>
                    <span className="font-semibold">
                      {formatAmount(transaction.amount, transaction.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction:</span>
                    <span className="font-mono text-xs">{transactionId?.slice(-8)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <>
        <SuccessConfetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4">
          <Card className="w-full max-w-md border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                    <CheckCircle2 className="h-16 w-16 text-green-500 relative" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Paiement réussi ! 🎉
                  </h2>
                  <p className="text-muted-foreground">
                    Votre rechargement a été effectué avec succès.
                  </p>
                </div>

                {transaction && (
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Montant crédité:</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Redirection automatique dans <span className="font-bold text-foreground">{countdown}s</span>
                </div>

                <Button 
                  onClick={redirectToDashboard}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 p-4">
        <Card className="w-full max-w-md border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-orange-500" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  Paiement annulé
                </h2>
                <p className="text-muted-foreground">
                  Vous avez annulé le paiement Orange Money.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleRetry}
                  className="flex-1"
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button 
                  onClick={handleRetry}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'failed' || status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 p-4">
        <Card className="w-full max-w-md border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                  <XCircle className="h-16 w-16 text-red-500 relative" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {status === 'expired' ? 'Paiement expiré' : 'Paiement échoué'}
                </h2>
                <p className="text-muted-foreground">
                  {status === 'expired' 
                    ? 'Le délai de paiement a expiré. Veuillez réessayer.'
                    : 'Une erreur est survenue lors du traitement de votre paiement.'
                  }
                </p>
              </div>

              {transaction?.metadata?.failure_reason && (
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 text-sm text-left">
                  <p className="text-red-600 dark:text-red-400">
                    <strong>Raison:</strong> {transaction.metadata.failure_reason}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleRetry}
                  className="flex-1"
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button 
                  onClick={handleRetry}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};
