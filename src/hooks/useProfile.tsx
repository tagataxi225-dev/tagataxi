import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  user_type: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      // Si aucun profil n'est trouvé, essayer de le créer automatiquement
      if (!data) {
        console.log('Profile not found, creating one...');
        
        // Appeler la fonction pour créer un profil
        const { data: profileId, error: createError } = await supabase
          .rpc('ensure_user_profile', { p_user_id: user.id });

        if (createError) {
          console.error('Error creating profile:', createError);
          // Créer un profil de base manuellement
          const { data: manualProfile, error: manualError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              display_name: user?.user_metadata?.display_name || user?.email || 'Utilisateur',
              phone_number: user?.phone || null,
              user_type: 'client'
            })
            .select()
            .single();
          
          if (manualError) {
            throw manualError;
          }
          
          setProfile(manualProfile);
        } else {
          // Récupérer le profil complet après création
          const { data: createdProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();
          
          if (fetchError || !createdProfile) {
            throw fetchError || new Error('Profile not found after creation');
          }
          
          setProfile(createdProfile);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

    fetchProfile();
  }, [user?.id]);

  const getDisplayName = () => {
    if (profile?.display_name) {
      return profile.display_name;
    }
    
    // Fallback to user metadata
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    
    return 'Utilisateur';
  };

  return {
    profile,
    loading,
    error,
    displayName: getDisplayName()
  };
};