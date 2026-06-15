import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface PartnerAccessInfo {
  isOwner: boolean;
  isTeamMember: boolean;
  teamRole?: string;
  partnerId?: string;
  partnerUserId?: string; // owner's user_id for team members
}

// Context global pour partager l'info d'accès
let currentPartnerAccess: PartnerAccessInfo | null = null;
export const getPartnerAccess = () => currentPartnerAccess;

export const PartnerGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, sessionReady } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const checkAccess = useCallback(async () => {
    if (!sessionReady) return;

    if (!user) {
      setLoading(false);
      navigate('/partner/auth');
      return;
    }

    try {
      // 1. Vérifier le rôle partner
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'partner')
        .eq('is_active', true)
        .maybeSingle();

      // 2. Vérifier profil partenaire direct (propriétaire)
      const { data: profileData } = await supabase
        .from('partenaires')
        .select('id, company_name, verification_status, is_active, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      // ── Chemin 1 : Propriétaire direct ──
      if (roleData && profileData) {
        if (profileData.verification_status !== 'verified' || !profileData.is_active) {
          setLoading(false);
          navigate('/partner/pending-approval');
          return;
        }

        currentPartnerAccess = {
          isOwner: true,
          isTeamMember: false,
          partnerId: profileData.id,
          partnerUserId: user.id,
        };

        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      // ── Chemin 2 : Membre d'équipe ──
      // Vérifier si l'utilisateur est membre actif d'une équipe
      const { data: membership } = await supabase
        .from('team_members')
        .select('id, team_id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership) {
        // Charger le team_account pour obtenir le owner_id
        const { data: teamAccount } = await supabase
          .from('team_accounts')
          .select('owner_id')
          .eq('id', membership.team_id)
          .single();

        if (teamAccount) {
          // Charger le profil partenaire du propriétaire
          const { data: ownerProfile } = await supabase
            .from('partenaires')
            .select('id, company_name, verification_status, is_active')
            .eq('user_id', teamAccount.owner_id)
            .maybeSingle();

          if (ownerProfile && ownerProfile.verification_status === 'verified' && ownerProfile.is_active) {
            currentPartnerAccess = {
              isOwner: false,
              isTeamMember: true,
              teamRole: membership.role,
              partnerId: ownerProfile.id,
              partnerUserId: teamAccount.owner_id,
            };

            setIsAuthorized(true);
            setLoading(false);
            return;
          }
        }
      }

      // ── Chemin 3 : Invitation en attente ──
      const { data: pendingInvite } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (pendingInvite) {
        // Rediriger vers une page d'acceptation ou pending
        // Pour l'instant on les laisse passer pour qu'ils voient le dashboard avec une bannière
        // On gère ça dans PartnerApp
      }

      // Aucun accès
      if (!roleData) {
        navigate('/partner/auth', { replace: true });
      } else if (!profileData) {
        navigate('/partner/register');
      } else {
        navigate('/partner/pending-approval');
      }
      setLoading(false);
    } catch (error) {
      console.error('❌ PartnerGuard error:', error);
      setLoading(false);
      navigate('/partner/auth', { replace: true });
    }
  }, [user, sessionReady, navigate]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Timeout de sécurité
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        navigate('/partner/auth');
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [loading, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-muted-foreground">Vérification en cours...</span>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
};
