import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { logger } from '@/utils/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { secureStorage } from '@/utils/secureStorage';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    
    if (!email || !password) {
      toast.error(t('auth.fill_all_fields'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      logger.info('✅ Login successful', { userId: data.user?.id });

      // ✅ CORRECTION : Augmenter délai de stabilisation à 1.5s pour Afrique
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ✅ CORRECTION : Forcer refresh session + attendre confirmation
      const { data: { session: refreshedSession }, error: sessionError } = 
        await supabase.auth.refreshSession();
      
      if (sessionError || !refreshedSession) {
        logger.error('❌ Session non établie après connexion', sessionError);
        throw new Error('Session non établie. Veuillez réessayer.');
      }
      
      // ✅ NOUVEAU : Vérifier que le refresh token est VALIDE
      const { data: { user: verifiedUser }, error: verifyError } = 
        await supabase.auth.getUser();

      if (verifyError || !verifiedUser) {
        logger.error('❌ Utilisateur non vérifié après refresh', verifyError);
        localStorage.removeItem('kwenda_login_intent');
        localStorage.removeItem('kwenda_selected_role');
        await supabase.auth.signOut();
        throw new Error('Session invalide. Veuillez vous reconnecter.');
      }
      
      logger.info('📦 Session verified', { 
        hasSession: !!refreshedSession,
        expiresAt: refreshedSession.expires_at,
        userId: verifiedUser.id,
        refreshTokenValid: !!refreshedSession.refresh_token
      });

      // ✅ Vérifier rôle admin AVANT de stocker loginIntent
      const { data: isAdmin, error: roleError } = await supabase
        .rpc('is_current_user_admin');

      if (roleError) {
        logger.error('❌ Erreur vérification rôle admin', roleError);
        localStorage.removeItem('kwenda_login_intent');
        localStorage.removeItem('kwenda_selected_role');
        await supabase.auth.signOut();
        throw new Error('Impossible de vérifier vos permissions. Réessayez.');
      }

      if (!isAdmin) {
        localStorage.removeItem('kwenda_login_intent');
        localStorage.removeItem('kwenda_selected_role');
        await supabase.auth.signOut();
        toast.error(t('auth.access_denied'), {
          description: t('auth.not_authorized_admin')
        });
        return;
      }

      // ✅ CORRECTION : Invalider le cache des rôles AVANT navigation
      secureStorage.removeItem('kwenda_user_roles_cache');
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      logger.info('🔄 [AdminLogin] Cache rôles invalidé');

      // ✅ Stocker loginIntent APRÈS vérification réussie
      localStorage.setItem('kwenda_login_intent', 'admin');
      localStorage.setItem('kwenda_selected_role', 'admin');

      toast.success(t('auth.login_success'), {
        description: t('auth.welcome_admin')
      });

      // ✅ Attendre sync cache
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/operatorx/admin', { replace: true });
      }
    } catch (error: any) {
      logger.error('Erreur de connexion admin', error);
      toast.error(t('auth.login_error'), {
        description: error.message || t('auth.check_credentials')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 dark:from-background dark:to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 space-y-6 animate-fade-in">
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-gray-950 shadow-lg mb-6 overflow-hidden hover:scale-105 transition-transform duration-300">
            <BrandLogo size={72} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <Shield className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {t('auth.admin_space')}
            </span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {t('auth.admin_title')}
          </h1>
          
          <p className="text-base text-gray-600 dark:text-gray-400">
            {t('auth.admin_subtitle')}
          </p>
        </div>

        <Card className="shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-scale-in">
          <CardContent className="pt-8 pb-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-100">{t('auth.email')}</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.admin_email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 pr-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-100">{t('auth.password')}</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>




              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? t('auth.logging_in') : t('auth.login_button')}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={() => setShowForgotPassword(true)}
              >
                {t('auth.forgot_password')}
              </Button>
            </form>
          </CardContent>
        </Card>


        <ForgotPasswordModal 
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    </div>
  );
};