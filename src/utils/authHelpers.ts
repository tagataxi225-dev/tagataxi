import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const getValidSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    toast.error('Session expirée', {
      description: 'Veuillez vous reconnecter pour continuer',
      action: {
        label: 'Reconnecter',
        onClick: () => {
          localStorage.clear();
          window.location.href = '/app/auth';
        }
      }
    });
    return null;
  }
  
  // Vérifier si le token expire bientôt (<5 min)
  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  
  if (expiresAt && (expiresAt - now) < 300) {
    // Refresh automatique
    console.log('🔄 Token proche expiration, refresh automatique...');
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    if (refreshedSession) {
      console.log('✅ Session rafraîchie avec succès');
      return refreshedSession;
    }
  }
  
  return session;
};
