import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type TeamRole = 'admin' | 'manager' | 'accountant' | 'viewer';
export type TeamMemberStatus = 'pending' | 'active' | 'inactive';

export interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  status: TeamMemberStatus;
  permissions: any;
  invited_at: string;
  joined_at: string | null;
  // Joined from profiles
  display_name?: string;
  phone_number?: string;
  email?: string;
}

export interface TeamAccountRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  settings: any;
  status: string | null;
  created_at: string;
  updated_at: string;
}

// Permissions par rôle d'équipe
export const TEAM_ROLE_PERMISSIONS: Record<TeamRole, {
  dashboard: boolean;
  drivers: boolean;
  fleet: boolean;
  analytics: boolean;
  settings: boolean;
}> = {
  admin: { dashboard: true, drivers: true, fleet: true, analytics: true, settings: true },
  manager: { dashboard: true, drivers: true, fleet: true, analytics: false, settings: false },
  accountant: { dashboard: true, drivers: false, fleet: false, analytics: true, settings: false },
  viewer: { dashboard: true, drivers: false, fleet: false, analytics: false, settings: false },
};

export const usePartnerTeamManagement = (partnerId?: string) => {
  const { user } = useAuth();
  const [teamAccount, setTeamAccount] = useState<TeamAccountRow | null>(null);
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Charger ou auto-créer le team_account
  const loadTeamData = useCallback(async () => {
    if (!user || !partnerId) return;

    try {
      setLoading(true);

      // 1. Chercher un team_account existant pour ce propriétaire
      let { data: team, error: teamError } = await supabase
        .from('team_accounts')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (teamError) throw teamError;

      // 2. Auto-créer si inexistant
      if (!team) {
        const { data: partner } = await supabase
          .from('partenaires')
          .select('company_name')
          .eq('id', partnerId)
          .single();

        const { data: newTeam, error: createError } = await supabase
          .from('team_accounts')
          .insert({
            owner_id: user.id,
            name: partner?.company_name ? `Équipe ${partner.company_name}` : 'Mon équipe',
          })
          .select()
          .single();

        if (createError) throw createError;
        team = newTeam;
      }

      setTeamAccount(team);

      // 3. Charger les membres avec profils
      if (team) {
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', team.id)
          .order('invited_at', { ascending: false });

        if (membersError) throw membersError;

        // Enrichir avec les profils
        if (membersData && membersData.length > 0) {
          const userIds = membersData.map(m => m.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, phone_number')
            .in('user_id', userIds);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

          const enriched = membersData.map(m => ({
            ...m,
            role: m.role as TeamRole,
            status: m.status as TeamMemberStatus,
            display_name: profileMap.get(m.user_id)?.display_name || null,
            phone_number: profileMap.get(m.user_id)?.phone_number || null,
          }));

          setMembers(enriched as TeamMemberRow[]);
        } else {
          setMembers([]);
        }
      }
    } catch (err) {
      console.error('Erreur chargement équipe:', err);
      toast.error('Impossible de charger les données de l\'équipe');
    } finally {
      setLoading(false);
    }
  }, [user, partnerId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Inviter un membre par email
  const inviteMember = async (email: string, role: TeamRole): Promise<boolean> => {
    if (!teamAccount || !user) return false;

    setActionLoading(true);
    try {
      // Chercher l'utilisateur par email dans profiles (via clients ou chauffeurs)
      // On cherche dans plusieurs tables pour trouver le user_id
      let targetUserId: string | null = null;

      // Chercher dans clients
      const { data: clientData } = await supabase
        .from('clients')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();

      if (clientData) {
        targetUserId = clientData.user_id;
      }

      // Si pas trouvé, chercher dans chauffeurs
      if (!targetUserId) {
        const { data: driverData } = await supabase
          .from('chauffeurs')
          .select('user_id')
          .eq('email', email)
          .maybeSingle();
        if (driverData) {
          targetUserId = driverData.user_id;
        }
      }

      // Si pas trouvé, chercher dans partenaires
      if (!targetUserId) {
        const { data: partnerData } = await supabase
          .from('partenaires')
          .select('user_id')
          .eq('email', email)
          .maybeSingle();
        if (partnerData) {
          targetUserId = partnerData.user_id;
        }
      }

      if (!targetUserId) {
        toast.error('Utilisateur introuvable', {
          description: 'Cet email ne correspond à aucun compte Tembea. L\'utilisateur doit d\'abord créer un compte.'
        });
        return false;
      }

      // Vérifier qu'il n'est pas déjà membre
      const { data: existing } = await supabase
        .from('team_members')
        .select('id, status')
        .eq('team_id', teamAccount.id)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'active') {
          toast.error('Ce membre fait déjà partie de votre équipe');
        } else {
          // Réactiver
          await supabase
            .from('team_members')
            .update({ status: 'pending', role })
            .eq('id', existing.id);
          toast.success('Invitation renvoyée');
          await loadTeamData();
        }
        return false;
      }

      // Insérer le nouveau membre
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamAccount.id,
          user_id: targetUserId,
          role,
          status: 'pending',
        });

      if (insertError) throw insertError;

      toast.success('Invitation envoyée !', {
        description: `L'utilisateur sera notifié à sa prochaine connexion`
      });

      await loadTeamData();
      return true;
    } catch (err) {
      console.error('Erreur invitation:', err);
      toast.error('Impossible d\'envoyer l\'invitation');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Modifier le rôle d'un membre
  const updateMemberRole = async (memberId: string, newRole: TeamRole) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Rôle mis à jour');
      await loadTeamData();
    } catch (err) {
      console.error('Erreur mise à jour rôle:', err);
      toast.error('Impossible de modifier le rôle');
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer un membre
  const removeMember = async (memberId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      toast.success('Membre retiré de l\'équipe');
      await loadTeamData();
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.error('Impossible de retirer le membre');
    } finally {
      setActionLoading(false);
    }
  };

  // Accepter une invitation (côté membre invité)
  const acceptInvitation = async (memberId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ status: 'active', joined_at: new Date().toISOString() })
        .eq('id', memberId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Ajouter le rôle partner si pas déjà présent
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'partner')
        .maybeSingle();

      if (!existingRole) {
        await supabase.from('user_roles').insert({
          user_id: user.id,
          role: 'partner',
          is_active: true,
        });
      }

      toast.success('Invitation acceptée ! Bienvenue dans l\'équipe.');
      await loadTeamData();
    } catch (err) {
      console.error('Erreur acceptation:', err);
      toast.error('Impossible d\'accepter l\'invitation');
    } finally {
      setActionLoading(false);
    }
  };

  // Refuser une invitation
  const declineInvitation = async (memberId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'inactive' })
        .eq('id', memberId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.info('Invitation refusée');
      await loadTeamData();
    } catch (err) {
      console.error('Erreur refus:', err);
      toast.error('Impossible de refuser l\'invitation');
    } finally {
      setActionLoading(false);
    }
  };

  return {
    teamAccount,
    members,
    loading,
    actionLoading,
    inviteMember,
    updateMemberRole,
    removeMember,
    acceptInvitation,
    declineInvitation,
    refresh: loadTeamData,
  };
};
