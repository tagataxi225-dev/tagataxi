import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPaymentRequest {
  plan_id: string;
  action: 'subscribe' | 'upgrade' | 'downgrade' | 'cancel';
}

export const usePartnerRentalPayment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const subscribeMutation = useMutation({
    mutationFn: async ({ plan_id, action }: SubscriptionPaymentRequest) => {
      const { data, error } = await supabase.functions.invoke('partner-rental-subscription-manager', {
        body: { 
          plan_id,
          action
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-rental-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['rental-subscription-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-wallet'] });
      
      toast({
        title: "✅ Succès",
        description: data.message,
      });
    },
    onError: (error: any) => {
      console.error('Erreur abonnement location:', error);
      
      // Message personnalisé pour solde insuffisant
      if (error.message?.includes('insuffisant')) {
        toast({
          title: "💰 Solde insuffisant",
          description: "Veuillez recharger votre wallet TAGAPay pour souscrire à ce plan",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: error.message || "Impossible de traiter l'abonnement",
          variant: "destructive",
        });
      }
    }
  });

  return {
    subscribe: subscribeMutation.mutate,
    isProcessing: subscribeMutation.isPending,
    error: subscribeMutation.error
  };
};
