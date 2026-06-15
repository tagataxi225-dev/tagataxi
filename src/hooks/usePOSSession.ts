import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface POSSession {
  id: string;
  restaurant_id: string;
  opened_by: string;
  opened_at: string;
  closed_at: string | null;
  closed_by: string | null;
  opening_cash: number;
  closing_cash: number | null;
  expected_cash: number | null;
  cash_difference: number | null;
  total_transactions: number;
  total_sales: number;
  status: 'open' | 'closed' | 'reconciled';
  notes: string | null;
}

export const usePOSSession = () => {
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(false);

  const openSession = async (restaurantId: string, openingCash: number) => {
    try {
      setLoading(true);

      // Récupérer l'utilisateur connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: 'Erreur d\'authentification',
          description: 'Vous devez être connecté pour ouvrir une session',
          variant: 'destructive',
        });
        return null;
      }

      // Vérifier qu'il n'y a pas de session ouverte
      const { data: existingSession } = await supabase
        .from('restaurant_pos_sessions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'open')
        .maybeSingle();

      if (existingSession) {
        toast({
          title: 'Session déjà ouverte',
          description: 'Fermez la session actuelle avant d\'en ouvrir une nouvelle',
          variant: 'destructive',
        });
        return null;
      }

      const { data: session, error } = await supabase
        .from('restaurant_pos_sessions')
        .insert({
          restaurant_id: restaurantId,
          opened_by: user.id,
          opening_cash: openingCash,
          status: 'open' as const,
        } as any)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(session as POSSession);
      toast({
        title: '✅ Session ouverte',
        description: `Fond de caisse: ${openingCash.toLocaleString()} CDF`,
      });

      return session;
    } catch (error: any) {
      console.error('Error opening POS session:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ouvrir la session',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const closeSession = async (sessionId: string, closingCash: number) => {
    try {
      setLoading(true);

      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté',
          variant: 'destructive',
        });
        return null;
      }

      // Récupérer les transactions de la session
      const { data: transactions } = await supabase
        .from('restaurant_pos_transactions')
        .select('total_amount, payment_method')
        .eq('session_id', sessionId);

      const expectedCash = (currentSession?.opening_cash || 0) + 
        (transactions?.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + t.total_amount, 0) || 0);

      const cashDifference = closingCash - expectedCash;

      const { data: session, error } = await supabase
        .from('restaurant_pos_sessions')
        .update({
          closed_at: new Date().toISOString(),
          closed_by: user.id,
          closing_cash: closingCash,
          expected_cash: expectedCash,
          cash_difference: cashDifference,
          total_transactions: transactions?.length || 0,
          total_sales: transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0,
          status: 'closed' as const,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(null);
      toast({
        title: '✅ Session fermée',
        description: cashDifference !== 0 
          ? `Écart de caisse: ${Math.abs(cashDifference).toLocaleString()} CDF ${cashDifference > 0 ? 'en trop' : 'manquant'}`
          : 'Caisse équilibrée',
      });

      return session;
    } catch (error: any) {
      console.error('Error closing session:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSession = async (restaurantId: string) => {
    try {
      setLoading(true);

      const { data: session, error } = await supabase
        .from('restaurant_pos_sessions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'open')
        .maybeSingle();

      if (error) throw error;

      setCurrentSession(session as POSSession | null);
      return session;
    } catch (error: any) {
      console.error('Error getting current session:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSessionHistory = async (restaurantId: string, limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_pos_sessions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('opened_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error getting session history:', error);
      return [];
    }
  };

  return {
    currentSession,
    loading,
    openSession,
    closeSession,
    getCurrentSession,
    getSessionHistory,
  };
};
