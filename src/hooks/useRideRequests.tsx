import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RideRequest {
  id: string;
  pickup_location: string;
  destination: string;
  pickup_coordinates: any;
  destination_coordinates: any;
  estimated_price: number;
  status: string;
  created_at: string;
}

export const useRideRequests = () => {
  const [loading, setLoading] = useState(false);

  const getUserRideRequests = async (): Promise<RideRequest[]> => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération ride requests:', error);
      toast.error('Impossible de charger les demandes');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getPendingRideRequests = async (): Promise<RideRequest[]> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération pending requests:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getUserRideRequests,
    getPendingRideRequests
  };
};
