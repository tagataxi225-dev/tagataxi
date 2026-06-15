import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { UserRole, AdminRole, Permission } from '@/types/roles';

interface UseRoleManagementReturn {
  assignRole: (userId: string, role: UserRole, adminRole?: AdminRole) => Promise<boolean>;
  removeRole: (userId: string, role: UserRole, adminRole?: AdminRole) => Promise<boolean>;
  getUserRoles: (userId: string) => Promise<any[]>;
  checkPermission: (userId: string, permission: Permission) => Promise<boolean>;
  syncPermissionsToDb: (matrix: Record<string, Permission[]>) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const useRoleManagement = (): UseRoleManagementReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const invalidateRolesCaches = () => {
    queryClient.invalidateQueries({ queryKey: ['userRoles'] });
    queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    queryClient.invalidateQueries({ queryKey: ['permissions'] });
  };

  const logActivity = async (userId: string, description: string, metadata?: any) => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      await supabase.from('activity_logs').insert({
        activity_type: 'role_assignment',
        description,
        user_id: currentUser?.id || null,
        reference_id: userId,
        reference_type: 'user',
        metadata: metadata || null,
      });
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  };

  const assignRole = async (userId: string, role: UserRole, adminRole?: AdminRole): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = (await supabase.auth.getUser()).data.user;

      const { error: assignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          admin_role: adminRole || null,
          assigned_by: currentUser?.id
        });

      if (assignError) {
        setError(`Erreur lors de l'assignation du rôle: ${assignError.message}`);
        return false;
      }

      await logActivity(userId, `Rôle ${role}${adminRole ? ` (${adminRole})` : ''} assigné`, { role, admin_role: adminRole, action: 'assign' });
      invalidateRolesCaches();
      return true;
    } catch (err) {
      console.error('Error in assignRole:', err);
      setError('Erreur lors de l\'assignation du rôle');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (userId: string, role: UserRole, adminRole?: AdminRole): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role', role);

      if (adminRole) {
        query = query.eq('admin_role', adminRole);
      } else {
        query = query.is('admin_role', null);
      }

      const { error: removeError } = await query;

      if (removeError) {
        setError(`Erreur lors de la suppression du rôle: ${removeError.message}`);
        return false;
      }

      await logActivity(userId, `Rôle ${role}${adminRole ? ` (${adminRole})` : ''} retiré`, { role, admin_role: adminRole, action: 'remove' });
      invalidateRolesCaches();
      return true;
    } catch (err) {
      console.error('Error in removeRole:', err);
      setError('Erreur lors de la suppression du rôle');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getUserRoles = async (userId: string): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        setError(`Erreur lors de la récupération des rôles: ${rolesError.message}`);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getUserRoles:', err);
      setError('Erreur lors de la récupération des rôles');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = async (userId: string, permission: Permission): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: permissionError } = await supabase.rpc('has_permission', {
        p_user_id: userId,
        p_permission: permission
      });

      if (permissionError) {
        setError(`Erreur lors de la vérification des permissions: ${permissionError.message}`);
        return false;
      }

      return data || false;
    } catch (err) {
      console.error('Error in checkPermission:', err);
      setError('Erreur lors de la vérification des permissions');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const syncPermissionsToDb = async (matrix: Record<string, Permission[]>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Build rows to upsert into role_permissions
      const rows: Array<{ role: string; admin_role: string; permission: string; is_active: boolean }> = [];

      for (const [adminRole, permissions] of Object.entries(matrix)) {
        for (const perm of permissions) {
          rows.push({
            role: 'admin' as const,
            admin_role: adminRole as any,
            permission: perm as any,
            is_active: true,
          });
        }
      }

      // Insert missing, skip existing (on conflict do nothing)
      const { error: syncError } = await supabase
        .from('role_permissions')
        .upsert(rows as any, { onConflict: 'role,admin_role,permission', ignoreDuplicates: true });

      if (syncError) {
        setError(`Erreur sync: ${syncError.message}`);
        return false;
      }

      invalidateRolesCaches();
      return true;
    } catch (err) {
      console.error('Error in syncPermissionsToDb:', err);
      setError('Erreur lors de la synchronisation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    assignRole,
    removeRole,
    getUserRoles,
    checkPermission,
    syncPermissionsToDb,
    loading,
    error
  };
};
