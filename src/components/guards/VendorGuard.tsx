import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const VendorGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    checkVendorAccess();
  }, [user]);

  const checkVendorAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    // ✅ Vérification 1 : rôle vendor direct (propriétaire)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'vendor')
      .eq('is_active', true)
      .maybeSingle();

    if (roleData) {
      // Vérifier que le profil vendeur existe
      const { data: profileData } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setIsVendor(true);
        setLoading(false);
        return;
      }
    }

    // ✅ Vérification 2 : membre d'une équipe vendeur (via team_members -> team_accounts -> vendor owner)
    const { data: teamMembership } = await supabase
      .from('team_members')
      .select('id, role, status, team_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (teamMembership && teamMembership.length > 0) {
      // Vérifier si l'un des teams appartient à un vendeur
      const teamIds = teamMembership.map(tm => tm.team_id);
      const { data: teamAccounts } = await supabase
        .from('team_accounts')
        .select('id, owner_id')
        .in('id', teamIds);

      if (teamAccounts && teamAccounts.length > 0) {
        const ownerIds = teamAccounts.map(ta => ta.owner_id);
        
        // Vérifier si un des owners a un profil vendeur
        const { data: vendorOwners } = await supabase
          .from('vendor_profiles')
          .select('user_id')
          .in('user_id', ownerIds);

        if (vendorOwners && vendorOwners.length > 0) {
          setIsVendor(true);
          setLoading(false);
          return;
        }
      }
    }

    // Aucun accès vendeur trouvé
    if (roleData) {
      // A le rôle vendor mais pas de profil -> inscription
      navigate('/vendeur/inscription');
    } else {
      navigate('/marketplace');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return isVendor ? <>{children}</> : null;
};
