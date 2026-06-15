import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AutoCancellationResult {
  success: boolean;
  cancelled?: {
    transport: number;
    delivery: number;
    marketplace: number;
    total: number;
  };
  timestamp?: string;
  error?: string;
}

export const useAutoCancellation = () => {
  const [loading, setLoading] = useState(false);

  const triggerAutoCancellation = async (): Promise<AutoCancellationResult | null> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-cancel-expired-orders', {
        body: {}
      });

      if (error) {
        console.error('Error calling auto-cancel function:', error);
        toast.error('Erreur lors de l\'annulation automatique');
        return null;
      }

      if (data?.success) {
        const total = data.cancelled?.total || 0;
        if (total > 0) {
          toast.success(
            `${total} commande(s) expirée(s) annulée(s) automatiquement`,
            {
              description: `Transport: ${data.cancelled.transport}, Livraison: ${data.cancelled.delivery}, Marketplace: ${data.cancelled.marketplace}`
            }
          );
        } else {
          toast.info('Aucune commande expirée à annuler');
        }
        return data;
      }

      return data;
    } catch (error) {
      console.error('Exception in triggerAutoCancellation:', error);
      toast.error('Erreur inattendue lors de l\'annulation automatique');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    triggerAutoCancellation,
    loading
  };
};
