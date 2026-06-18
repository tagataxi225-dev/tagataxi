import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type RestaurantTeamRole = 'admin' | 'chef' | 'cashier' | 'viewer';
export type TeamMemberStatus = 'pending' | 'active' | 'inactive';

export interface RestaurantTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: RestaurantTeamRole;
  status: TeamMemberStatus;
  permissions: any;
  invited_at: string;
  joined_at: string | null;
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

export const RESTAURANT_TEAM_ROLE_PERMISSIONS: Record<RestaurantTeamRole, {
  label: string;
  menu: boolean | 'read';
  orders: boolean | 'read';
  finances: boolean | 'read';
  settings: boolean;
}> = {
  admin: { label: 'Administrateur', menu: true, orders: true, finances: true, settings: true },
  chef: { label: 'Chef/Gérant', menu: true, orders: true, finances: false, settings: false },
  cashier: { label: 'Caissier', menu: false, orders: true, finances: 'read', settings: false },
  viewer: { label: 'Observateur', menu: 'read', orders: 'read', finances: false, settings: false },
};

const isPhoneInput = (input: string): boolean => {
  const cleaned = input.replace(/[\s\-\+]/g, '');
  return /^[0-9]{6,15}$/.test(cleaned);
};

export const useRestaurantTeamManagement = () => {
  const { user } = useAuth();
  const [teamAccount, setTeamAccount] = useState<TeamAccountRow | null>(null);
  const [members, setMembers] = useState<RestaurantTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadTeamData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      let { data: team, error: teamError } = await supabase
        .from('team_accounts')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (teamError) throw teamError;

      if (!team) {
        const { data: restaurantProfile } = await supabase
          .from('restaurant_profiles')
          .select('restaurant_name')
          .eq('user_id', user.id)
          .single();

        const { data: newTeam, error: createError } = await supabase
          .from('team_accounts')
          .insert({
            owner_id: user.id,
            name: restaurantProfile?.restaurant_name ? `Équipe ${restaurantProfile.restaurant_name}` : 'Mon équipe restaurant',
          })
          .select()
          .single();

        if (createError) throw createError;
        team = newTeam;
      }

      setTeamAccount(team);

      if (team) {
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', team.id)
          .order('invited_at', { ascending: false });

        if (membersError) throw membersError;

        if (membersData && membersData.length > 0) {
          const userIds = membersData.map(m => m.user_id);

          const [profilesRes, clientsRes] = await Promise.all([
            supabase.from('profiles').select('user_id, display_name, phone_number').in('user_id', userIds),
            supabase.from('clients').select('user_id, display_name, phone_number, email').in('user_id', userIds),
          ]);

          const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
          const clientMap = new Map(clientsRes.data?.map(c => [c.user_id, c]) || []);

          const enriched = membersData.map(m => {
            const profile = profileMap.get(m.user_id);
            const client = clientMap.get(m.user_id);
            return {
              ...m,
              role: m.role as RestaurantTeamRole,
              status: m.status as TeamMemberStatus,
              display_name: profile?.display_name || client?.display_name || null,
              phone_number: profile?.phone_number || client?.phone_number || null,
              email: client?.email || null,
            };
          });

          setMembers(enriched as RestaurantTeamMember[]);
        } else {
          setMembers([]);
        }
      }
    } catch (err) {
      console.error('Erreur chargement équipe restaurant:', err);
      toast.error('Impossible de charger les données de l\'équipe');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const inviteMember = async (searchInput: string, role: RestaurantTeamRole): Promise<boolean> => {
    if (!teamAccount || !user) return false;

    setActionLoading(true);
    try {
      let targetUserId: string | null = null;
      const isPhone = isPhoneInput(searchInput);

      if (isPhone) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('user_id')
          .eq('phone_number', searchInput)
          .maybeSingle();
        if (clientData) targetUserId = clientData.user_id;

        if (!targetUserId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('phone_number', searchInput)
            .maybeSingle();
          if (profileData) targetUserId = profileData.user_id;
        }
      } else {
        const { data: clientData } = await supabase
          .from('clients')
          .select('user_id')
          .eq('email', searchInput)
          .maybeSingle();
        if (clientData) targetUserId = clientData.user_id;

        if (!targetUserId) {
          const { data: driverData } = await supabase
            .from('chauffeurs')
            .select('user_id')
            .eq('email', searchInput)
            .maybeSingle();
          if (driverData) targetUserId = driverData.user_id;
        }

        if (!targetUserId) {
          const { data: partnerData } = await supabase
            .from('partenaires')
            .select('user_id')
            .eq('email', searchInput)
            .maybeSingle();
          if (partnerData) targetUserId = partnerData.user_id;
        }
      }

      if (!targetUserId) {
        toast.error('Utilisateur introuvable', {
          description: isPhone
            ? 'Ce numéro ne correspond à aucun compte TAGA.'
            : 'Cet email ne correspond à aucun compte TAGA.'
        });
        return false;
      }

      if (targetUserId === user.id) {
        toast.error('Vous ne pouvez pas vous inviter vous-même');
        return false;
      }

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
          await supabase
            .from('team_members')
            .update({ status: 'active', role, joined_at: new Date().toISOString() })
            .eq('id', existing.id);
          toast.success('Membre réactivé dans l\'équipe !');
          await loadTeamData();
        }
        return false;
      }

      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamAccount.id,
          user_id: targetUserId,
          role,
          status: 'active',
          joined_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Auto-add restaurant role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('role', 'restaurant')
        .maybeSingle();

      if (!existingRole) {
        await supabase.from('user_roles').insert({
          user_id: targetUserId,
          role: 'restaurant',
          is_active: true,
        });
      }

      toast.success('Membre ajouté à l\'équipe !');
      await loadTeamData();
      return true;
    } catch (err) {
      console.error('Erreur invitation:', err);
      toast.error('Impossible d\'ajouter le membre');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: RestaurantTeamRole) => {
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

  return {
    teamAccount,
    members,
    loading,
    actionLoading,
    inviteMember,
    updateMemberRole,
    removeMember,
    refresh: loadTeamData,
  };
};
