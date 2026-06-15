import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TeamRequest {
  id: string;
  user_id: string;
  company_name: string;
  industry?: string;
  team_size?: string;
  contact_email: string;
  phone?: string;
  request_reason?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

interface TeamRequestsHook {
  requests: TeamRequest[];
  loading: boolean;
  error: string | null;
  submitRequest: (data: {
    company_name: string;
    industry?: string;
    team_size?: string;
    contact_email: string;
    phone?: string;
    request_reason?: string;
  }) => Promise<void>;
  refreshRequests: () => void;
}

export const useTeamRequests = (): TeamRequestsHook => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('team_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setRequests(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des demandes:', err);
      setError('Impossible de charger vos demandes d\'équipe');
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (data: {
    company_name: string;
    industry?: string;
    team_size?: string;
    contact_email: string;
    phone?: string;
    request_reason?: string;
  }) => {
    if (!user) throw new Error('Utilisateur non connecté');

    const { error: insertError } = await supabase
      .from('team_requests')
      .insert({
        user_id: user.id,
        ...data
      });

    if (insertError) throw insertError;

    // Rafraîchir la liste après soumission
    await fetchUserRequests();
  };

  useEffect(() => {
    if (user) {
      fetchUserRequests();
    }
  }, [user]);

  return {
    requests,
    loading,
    error,
    submitRequest,
    refreshRequests: fetchUserRequests
  };
};