import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface UserRoleData {
  role: string;
  data: any;
  isActive: boolean;
}

export const useRoleBasedAuth = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRoleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = async () => {
    if (!user?.id) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Appeler la fonction pour obtenir le rôle
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
        user_id_param: user.id
      });

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        setError('Erreur lors du chargement du rôle');
        return;
      }

      if (!roleData) {
        // Aucun rôle trouvé, créer un profil client par défaut
        await createDefaultClientProfile();
        return;
      }

      // Récupérer les données détaillées selon le rôle
      let roleDetails = null;
      switch (roleData) {
        case 'admin':
          const { data: adminData } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();
          roleDetails = adminData;
          break;
        case 'partenaire':
          const { data: partenaireData } = await supabase
            .from('partenaires')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();
          roleDetails = partenaireData;
          break;
        case 'chauffeur':
          const { data: chauffeurData } = await supabase
            .from('chauffeurs')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();
          roleDetails = chauffeurData;
          break;
        case 'simple_user_client':
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();
          roleDetails = clientData;
          break;
      }

      setUserRole({
        role: roleData,
        data: roleDetails,
        isActive: roleDetails?.is_active || false
      });

    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      setError('Erreur lors du chargement du rôle');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultClientProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          display_name: user.user_metadata?.display_name || user.email || 'Utilisateur',
          phone_number: user.phone || '',
          email: user.email || ''
        })
        .select()
        .single();

      if (error) throw error;

      setUserRole({
        role: 'simple_user_client',
        data: data,
        isActive: true
      });
    } catch (err) {
      console.error('Error creating default client profile:', err);
      setError('Erreur lors de la création du profil');
    }
  };

  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'partenaire':
        return '/partner';
      case 'chauffeur':
        return '/chauffeur';
      case 'simple_user_client':
      default:
        return '/';
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user?.id]);

  const refetch = async () => {
    await fetchUserRole();
  };

  return {
    userRole,
    loading,
    error,
    refetch,
    getRedirectPath
  };
};