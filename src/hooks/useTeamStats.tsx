import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TeamStatsHook {
  totalTeams: number;
  activeTeams: number;
  pendingApprovals: number;
  totalMembers: number;
  totalRevenue: number;
  loading: boolean;
  error: string | null;
  refreshStats: () => void;
}

export const useTeamStats = (): TeamStatsHook => {
  const [stats, setStats] = useState({
    totalTeams: 0,
    activeTeams: 0,
    pendingApprovals: 0,
    totalMembers: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simuler des données pour l'instant - sera remplacé par de vraies requêtes
      const mockStats = {
        totalTeams: 12,
        activeTeams: 8,
        pendingApprovals: 3,
        totalMembers: 156,
        totalRevenue: 2450000
      };

      setStats(mockStats);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Impossible de charger les statistiques des équipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    ...stats,
    loading,
    error,
    refreshStats: fetchStats
  };
};