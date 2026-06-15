import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TeamAccount {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  settings?: any;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  permissions?: any;
  invited_at?: string;
  joined_at?: string;
  // Relations
  profiles?: {
    display_name?: string;
    phone_number?: string;
  };
}

interface TeamAccountHook {
  teamAccount: TeamAccount | null;
  teamMembers: TeamMember[];
  loading: boolean;
  error: string | null;
  refreshData: () => void;
  inviteMember: (email: string, role: string) => Promise<void>;
}

export const useTeamAccount = (): TeamAccountHook => {
  const { user } = useAuth();
  const [teamAccount, setTeamAccount] = useState<TeamAccount | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Vérifier si l'utilisateur a un compte équipe (propriétaire)
      const { data: ownedTeam, error: ownedError } = await supabase
        .from('team_accounts')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (ownedError && ownedError.code !== 'PGRST116') {
        throw ownedError;
      }

      // Si pas propriétaire, vérifier s'il est membre d'une équipe
      let memberTeam = null;
      if (!ownedTeam) {
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('team_accounts(*)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (memberError && memberError.code !== 'PGRST116') {
          throw memberError;
        }

        if (memberData?.team_accounts) {
          memberTeam = memberData.team_accounts;
        }
      }

      const currentTeam = ownedTeam || memberTeam;
      setTeamAccount(currentTeam);

      // Si on a une équipe, charger les membres
      if (currentTeam) {
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', currentTeam.id)
          .order('joined_at', { ascending: false });

        if (membersError) throw membersError;
        setTeamMembers(members || []);
      } else {
        setTeamMembers([]);
      }

    } catch (err) {
      console.error('Erreur lors du chargement des données équipe:', err);
      setError('Impossible de charger les données de l\'équipe');
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (email: string, role: string) => {
    if (!teamAccount || !user) {
      throw new Error('Équipe ou utilisateur non disponible');
    }

    // Ici on devrait créer une invitation
    // Pour l'instant, on simule juste
    console.log('Invitation envoyée à:', email, 'avec le rôle:', role);
    
    // TODO: Implémenter le système d'invitation par email
    // 1. Vérifier si l'utilisateur existe
    // 2. Créer une invitation en base
    // 3. Envoyer un email d'invitation
  };

  useEffect(() => {
    if (user) {
      fetchTeamData();
    }
  }, [user]);

  return {
    teamAccount,
    teamMembers,
    loading,
    error,
    refreshData: fetchTeamData,
    inviteMember
  };
};