import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ServiceChangeRequest {
  id: string;
  driver_id: string;
  current_service_type: string;
  requested_service_type: string;
  service_category: 'taxi' | 'delivery';
  reason?: string;
  justification_documents: any[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewer_comments?: string;
  created_at: string;
  updated_at: string;
}

export const useServiceChangeRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['service-change-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('service_change_requests')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServiceChangeRequest[];
    },
    enabled: !!user?.id,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (requestData: {
      currentServiceType: string;
      requestedServiceType: string;
      serviceCategory: 'taxi' | 'delivery';
      reason?: string;
      justificationDocuments?: any[];
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('service_change_requests')
        .insert({
          driver_id: user.id,
          current_service_type: requestData.currentServiceType,
          requested_service_type: requestData.requestedServiceType,
          service_category: requestData.serviceCategory,
          reason: requestData.reason,
          justification_documents: requestData.justificationDocuments || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-change-requests'] });
      toast({
        title: "Demande créée",
        description: "Votre demande de changement de service a été soumise.",
      });
    },
    onError: (error) => {
      console.error('Error creating service change request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande de changement.",
        variant: "destructive",
      });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from('service_change_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('driver_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-change-requests'] });
      toast({
        title: "Demande annulée",
        description: "Votre demande de changement a été annulée.",
      });
    },
    onError: (error) => {
      console.error('Error cancelling request:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la demande.",
        variant: "destructive",
      });
    },
  });

  const getPendingRequests = () => {
    return requests?.filter(req => req.status === 'pending') || [];
  };

  const getLatestRequest = () => {
    return requests?.[0];
  };

  const hasActivePendingRequest = () => {
    return getPendingRequests().length > 0;
  };

  return {
    requests: requests || [],
    loading: isLoading,
    createRequest: createRequestMutation.mutate,
    cancelRequest: cancelRequestMutation.mutate,
    getPendingRequests,
    getLatestRequest,
    hasActivePendingRequest,
    isCreating: createRequestMutation.isPending,
    isCancelling: cancelRequestMutation.isPending,
  };
};