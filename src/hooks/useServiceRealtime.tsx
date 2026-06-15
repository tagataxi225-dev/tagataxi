import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export const useServiceRealtime = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('service-configurations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_configurations' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['service-configurations'] });

          if (payload.eventType === 'UPDATE' && payload.new && !payload.new.is_active) {
            const serviceName = payload.new.display_name || payload.new.service_type;
            toast({
              title: "⚠️ Service désactivé",
              description: `Le service "${serviceName}" a été temporairement désactivé.`,
              variant: "destructive",
            });
          }

          if (payload.eventType === 'UPDATE' && payload.new && payload.new.is_active && payload.old && !payload.old.is_active) {
            const serviceName = payload.new.display_name || payload.new.service_type;
            toast({
              title: "✅ Service activé",
              description: `Le service "${serviceName}" est maintenant disponible !`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast]);

  return null;
};
