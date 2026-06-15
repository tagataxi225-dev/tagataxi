import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const RestaurantGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, sessionReady } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRestaurant, setIsRestaurant] = useState(false);

  const checkRestaurantRole = useCallback(async () => {
    // Attendre que la session soit prête
    if (!sessionReady) {
      console.log('🔍 RestaurantGuard: En attente de sessionReady...');
      return;
    }

    console.log('🔍 RestaurantGuard check', {
      hasUser: !!user,
      userId: user?.id,
      sessionReady
    });

    if (!user) {
      console.log('❌ RestaurantGuard: Pas d\'utilisateur, redirection vers /restaurant/auth');
      setLoading(false);
      navigate('/restaurant/auth', { replace: true });
      return;
    }

    try {
      // Vérification SÉCURISÉE via database
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'restaurant')
        .eq('is_active', true)
        .maybeSingle();

      if (roleError || !roleData) {
        console.error('❌ RestaurantGuard: Rôle restaurant manquant:', roleError);
        setLoading(false);
        navigate('/restaurant/auth', { replace: true });
        return;
      }

      console.log('✅ RestaurantGuard: Rôle restaurant confirmé');

      // Vérifier si propriétaire avec profil restaurant
      const { data: profileData } = await supabase
        .from('restaurant_profiles')
        .select('id, restaurant_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        console.log('✅ RestaurantGuard: Accès propriétaire pour', profileData.restaurant_name);
        setIsRestaurant(true);
        setLoading(false);
        return;
      }

      // Vérifier si membre d'une équipe restaurant (via team_members -> team_accounts -> restaurant owner)
      const { data: teamMembership } = await supabase
        .from('team_members')
        .select('id, role, status, team_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (teamMembership && teamMembership.length > 0) {
        const teamIds = teamMembership.map(tm => tm.team_id);
        const { data: teamAccounts } = await supabase
          .from('team_accounts')
          .select('id, owner_id')
          .in('id', teamIds);

        if (teamAccounts && teamAccounts.length > 0) {
          const ownerIds = teamAccounts.map(ta => ta.owner_id);
          const { data: restaurantOwners } = await supabase
            .from('restaurant_profiles')
            .select('user_id')
            .in('user_id', ownerIds);

          if (restaurantOwners && restaurantOwners.length > 0) {
            console.log('✅ RestaurantGuard: Accès équipe autorisé');
            setIsRestaurant(true);
            setLoading(false);
            return;
          }
        }
      }

      // Pas de profil ni d'équipe -> inscription
      console.error('❌ RestaurantGuard: Profil restaurant manquant');
      setLoading(false);
      navigate('/restaurant/register', { replace: true });

    } catch (error) {
      console.error('❌ RestaurantGuard: Erreur inattendue:', error);
      setLoading(false);
      navigate('/restaurant/auth', { replace: true });
    }
  }, [user, sessionReady, navigate]);

  useEffect(() => {
    checkRestaurantRole();
  }, [checkRestaurantRole]);

  // Timeout de sécurité : 10 secondes max
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error('❌ RestaurantGuard: Timeout de sécurité (10s)');
        setLoading(false);
        navigate('/restaurant/auth', { replace: true });
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [loading, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <span className="text-muted-foreground">Vérification en cours...</span>
      </div>
    );
  }

  return isRestaurant ? <>{children}</> : null;
};
