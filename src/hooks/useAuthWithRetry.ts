import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AuthResult {
  success: boolean;
  error?: string;
  roles?: any[];
  user?: any;
}

/**
 * Détecte si l'input est un numéro de téléphone (commence par 0, +, ou contient que des chiffres)
 */
const isPhoneInput = (input: string): boolean => {
  const cleaned = input.replace(/[\s\-\(\)]/g, '');
  return /^[+0][0-9]{8,}$/.test(cleaned);
};

/** signInWithPassword avec timeout 15s + retry réseau */
const signInWithTimeout = async (email: string, password: string, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    clearTimeout(timeoutId);
    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Retry 1x sur erreur réseau (pas credentials)
    const isNetworkError = error?.name === 'TypeError' || 
                           error?.name === 'AbortError' ||
                           error?.message?.includes('Failed to fetch');
    
    if (isNetworkError) {
      logger.warn('🔄 signIn retry après erreur réseau (500ms backoff)...');
      await new Promise(r => setTimeout(r, 500));
      return await supabase.auth.signInWithPassword({ email, password });
    }
    throw error;
  }
};

/**
 * Hook centralisé pour l'authentification avec retry automatique
 * Supporte connexion par email ou téléphone
 */
export const useAuthWithRetry = () => {
  /**
   * Résout un numéro de téléphone en email via RPC
   */
  const resolvePhoneToEmail = async (phone: string): Promise<string | null> => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    logger.info('📱 Resolving phone to email:', cleaned);
    
    const { data, error } = await (supabase.rpc as any)('get_email_by_phone', {
      p_phone: cleaned
    });

    if (error) {
      logger.error('❌ Phone resolution error', error);
      return null;
    }

    return data as string | null;
  };

  /**
   * Connexion avec retry automatique et vérification des rôles
   * Accepte email ou téléphone comme identifiant
   */
  const loginWithRetry = async (
    identifier: string,
    password: string,
    requiredRole?: 'client' | 'driver' | 'partner' | 'restaurant' | 'admin'
  ): Promise<AuthResult> => {
    try {
      let email = identifier;

      // Si c'est un téléphone, résoudre vers email
      if (isPhoneInput(identifier)) {
        const resolvedEmail = await resolvePhoneToEmail(identifier);
        if (!resolvedEmail) {
          return { 
            success: false, 
            error: 'Aucun compte associé à ce numéro de téléphone. Vérifiez le numéro ou connectez-vous avec votre email.' 
          };
        }
        email = resolvedEmail;
        logger.info('✅ Phone resolved to email');
      }

      logger.info('🔐 Attempting login for:', email);
      
      // Utiliser signInWithTimeout avec 15s timeout + retry réseau
      const { data, error } = await signInWithTimeout(email, password);

      if (error) {
        logger.error('❌ Login error', error);
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Identifiants incorrects. Vérifiez votre mot de passe.' };
        }
        return { success: false, error: error.message };
      }

      logger.info('✅ Login successful', { userId: data.user?.id });

      const refreshedSession = data.session;
      
      if (!refreshedSession) {
        logger.error('❌ Session non établie après connexion');
        return { success: false, error: 'Session non établie. Veuillez réessayer.' };
      }

      const user = data.user;

      if (user) {
        // ✅ Vérifier rôle — 1 retry max + fallback cache
        let roles;
        
        const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles', {
          p_user_id: user.id
        });

        if (!rolesError && rolesData) {
          roles = rolesData;
          logger.info('✅ Roles verified:', { roles: roles.map((r: any) => r.role) });
        } else {
          // 1 retry après 500ms
          logger.warn('⚠️ Retry get_user_roles (1/1)');
          await new Promise(resolve => setTimeout(resolve, 500));
          const retry = await supabase.rpc('get_user_roles', { p_user_id: user.id });
          if (!retry.error && retry.data) {
            roles = retry.data;
            logger.info('✅ Roles verified on retry:', { roles: roles.map((r: any) => r.role) });
          } else {
            // Fallback: utiliser le cache localStorage
            logger.warn('⚠️ RPC échoué 2x, tentative fallback cache');
            try {
              const cached = localStorage.getItem('kwenda_user_roles_cache');
              if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  roles = parsed;
                  logger.info('✅ Roles from cache fallback:', { roles: roles.map((r: any) => r.role) });
                }
              }
            } catch {}
            if (!roles) {
              return { success: false, error: 'Erreur lors de la vérification du rôle' };
            }
          }
        }

        // Sauvegarder en cache pour fallback futur
        try {
          localStorage.setItem('kwenda_user_roles_cache', JSON.stringify(roles));
        } catch {}

        if (!roles || roles.length === 0) {
          return { success: false, error: 'Aucun rôle trouvé pour ce compte' };
        }

        // Vérifier le rôle requis si spécifié
        if (requiredRole) {
          const hasRequiredRole = roles.some((r: any) => r.role === requiredRole);

          if (!hasRequiredRole) {
            localStorage.removeItem('kwenda_login_intent');
            localStorage.removeItem('kwenda_selected_role');
            localStorage.removeItem('kwenda_user_roles_cache');
            await supabase.auth.signOut();
            
            const otherRole = roles[0]?.role;
            let suggestion = '';
            
            if (otherRole === 'client') {
              suggestion = " Connectez-vous via l'espace client.";
            } else if (otherRole === 'driver') {
              suggestion = " Connectez-vous via l'espace chauffeur.";
            } else if (otherRole === 'partner') {
              suggestion = " Connectez-vous via l'espace partenaire.";
            } else if (otherRole === 'restaurant') {
              suggestion = " Connectez-vous via l'espace restaurant.";
            } else if (otherRole === 'admin') {
              suggestion = " Connectez-vous via l'espace admin.";
            }
            
            return { 
              success: false, 
              error: `Ce compte n'est pas un compte ${requiredRole}.${suggestion}`
            };
          }
        }

        return { success: true, roles, user };
      }

      return { success: false, error: 'Utilisateur non trouvé' };
    } catch (error: any) {
      logger.error("Login error", error);
      return { success: false, error: error.message || "Erreur lors de la connexion" };
    }
  };

  return { loginWithRetry, resolvePhoneToEmail, isPhoneInput };
};
