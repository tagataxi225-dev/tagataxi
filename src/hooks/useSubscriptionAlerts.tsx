import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionAlert {
  id: string;
  subscription_id: string;
  subscription_type: 'driver' | 'rental';
  alert_type: 'expiring_soon' | 'low_rides' | 'expired' | 'renewal_failed' | 'payment_required';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metadata: any;
  is_sent: boolean;
  sent_at: string | null;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export const useSubscriptionAlerts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer les alertes de l'utilisateur
  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['subscription-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('subscription_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SubscriptionAlert[];
    },
    enabled: !!user,
  });

  // Alertes non reconnues
  const unacknowledgedAlerts = alerts.filter(alert => !alert.is_acknowledged);

  // Alertes critiques
  const criticalAlerts = unacknowledgedAlerts.filter(alert => alert.severity === 'critical');

  // Mutation pour marquer une alerte comme reconnue
  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('subscription_alerts')
        .update({ 
          is_acknowledged: true, 
          acknowledged_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-alerts'] });
      toast({
        title: "Alerte reconnue",
        description: "L'alerte a été marquée comme lue",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de marquer l'alerte comme lue",
        variant: "destructive"
      });
    }
  });

  // Mutation pour marquer toutes les alertes comme reconnues
  const acknowledgeAllMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('subscription_alerts')
        .update({ 
          is_acknowledged: true, 
          acknowledged_at: new Date().toISOString() 
        })
        .eq('is_acknowledged', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-alerts'] });
      toast({
        title: "Alertes reconnues",
        description: "Toutes les alertes ont été marquées comme lues",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de marquer les alertes comme lues",
        variant: "destructive"
      });
    }
  });

  // Obtenir les alertes par type
  const getAlertsByType = (alertType: SubscriptionAlert['alert_type']) => {
    return alerts.filter(alert => alert.alert_type === alertType);
  };

  // Obtenir les alertes par sévérité
  const getAlertsBySeverity = (severity: SubscriptionAlert['severity']) => {
    return alerts.filter(alert => alert.severity === severity);
  };

  // Afficher une alerte toast pour les alertes critiques
  const showCriticalAlertsToast = () => {
    if (criticalAlerts.length > 0) {
      criticalAlerts.forEach(alert => {
        toast({
          title: "🚨 Alerte Critique",
          description: alert.message,
          variant: "destructive",
          duration: 10000, // 10 secondes pour les alertes critiques
        });
      });
    }
  };

  return {
    alerts,
    unacknowledgedAlerts,
    criticalAlerts,
    isLoading,
    refetch,
    acknowledgeAlert: acknowledgeMutation.mutate,
    acknowledgeAll: acknowledgeAllMutation.mutate,
    getAlertsByType,
    getAlertsBySeverity,
    showCriticalAlertsToast,
    hasUnacknowledgedAlerts: unacknowledgedAlerts.length > 0,
    unacknowledgedCount: unacknowledgedAlerts.length,
  };
};
