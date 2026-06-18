import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LegalDocumentSheet } from '@/components/shared/LegalDocumentSheet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, Phone, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthWithRetry } from '@/hooks/useAuthWithRetry';
import { toast } from 'sonner';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Formulaire de connexion client - Supporte téléphone ou email
 */
export const ClientLoginForm = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);

  const navigate = useNavigate();
  const { loginWithRetry, isPhoneInput } = useAuthWithRetry();
  const { t } = useLanguage();

  const isPhone = isPhoneInput(identifier);
  const IdentifierIcon = isPhone ? Phone : Mail;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      setError(t('auth.must_accept_terms'));
      return;
    }
    
    setLoading(true);
    setError(null);

    // ✅ Poser les flags AVANT le login pour que NavigationGuard ne redirige pas prématurément
    localStorage.setItem('kwenda_login_in_progress', 'true');
    localStorage.setItem('kwenda_selected_role', 'client');

    const result = await loginWithRetry(identifier, password);

    if (!result.success) {
      localStorage.removeItem('kwenda_login_in_progress');
      setError(result.error || 'Erreur lors de la connexion');
      setLoading(false);
      return;
    }

    // Détection automatique du rôle et redirection intelligente
    const roles = result.roles?.map((r: any) => r.role) || [];
    let targetRoute = '/app/client';
    let detectedRole = 'client';

    if (roles.includes('admin')) {
      detectedRole = 'admin';
      targetRoute = '/operatorx/admin';
    } else if (roles.includes('driver')) {
      detectedRole = 'driver';
      targetRoute = '/app/chauffeur';
    } else if (roles.includes('partner')) {
      detectedRole = 'partner';
      targetRoute = '/app/partenaire';
    } else if (roles.includes('restaurant')) {
      detectedRole = 'restaurant';
      targetRoute = '/app/restaurant';
    }

    localStorage.setItem('kwenda_login_intent', detectedRole);
    localStorage.setItem('kwenda_selected_role', detectedRole);

    toast.success(t('auth.login_success'), {
      description: t('auth.redirecting')
    });

    // ✅ Retirer le flag login avant navigation
    localStorage.removeItem('kwenda_login_in_progress');
    
    setLoading(false);
    navigate(targetRoute, { replace: true });
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {/* Identifier Field (Phone or Email) */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label htmlFor="client-identifier" className="text-sm font-medium text-foreground">
          Téléphone ou Email
        </Label>
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-xl opacity-0 blur transition-opacity duration-300 ${focusedField === 'identifier' ? 'opacity-20' : 'group-hover:opacity-10'}`} />
          <IdentifierIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${focusedField === 'identifier' ? 'text-primary' : 'text-muted-foreground'}`} />
          <Input
            id="client-identifier"
            type="text"
            placeholder="Téléphone ou email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onFocus={() => setFocusedField('identifier')}
            onBlur={() => setFocusedField(null)}
            required
            autoComplete="username"
            className="relative h-12 pl-11 pr-4 bg-white/50 dark:bg-gray-800/50 border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
          />
        </div>
      </motion.div>

      {/* Password Field */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Label htmlFor="client-password" className="text-sm font-medium text-foreground">
          {t('auth.password')}
        </Label>
        <div className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r from-primary to-primary/60 rounded-xl opacity-0 blur transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-20' : 'group-hover:opacity-10'}`} />
          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'}`} />
          <Input
            id="client-password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            required
            className="relative h-12 pl-11 pr-12 bg-white/50 dark:bg-gray-800/50 border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg hover:bg-muted/80"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive" className="bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 rounded-xl">
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <AlertDescription className="text-sm text-rose-700 dark:text-rose-300">
              {error}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Terms Checkbox */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-3"
      >
        <Checkbox
          id="terms-login"
          checked={acceptTerms}
          onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
          className="mt-0.5 flex-shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <Label htmlFor="terms-login" className="text-xs text-muted-foreground cursor-pointer leading-snug">
          J'accepte les{' '}
          <button type="button" onClick={() => setLegalSheet('terms')} className="text-primary font-medium hover:underline">
            conditions générales d'utilisation
          </button>{' '}
          et la{' '}
          <button type="button" onClick={() => setLegalSheet('privacy')} className="text-primary font-medium hover:underline">
            politique de confidentialité
          </button>{' '}
          de TAGA.
        </Label>
      </motion.div>

      {/* Login Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button 
          type="submit" 
          className="relative w-full h-12 rounded-xl bg-gradient-to-r from-primary via-primary/80 to-primary bg-[length:200%_100%] hover:bg-right text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-500 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !acceptTerms}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('auth.logging_in')}
              </>
            ) : (
              <>
                {t('auth.login_button')}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>
        </Button>
      </motion.div>

      {/* Forgot Password */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center"
      >
        <Button
          type="button"
          variant="link"
          className="text-sm text-primary hover:text-primary/80 transition-colors p-0 h-auto"
          onClick={() => setShowForgotPassword(true)}
        >
          {t('auth.forgot_password')}
        </Button>
      </motion.div>

      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />

      <LegalDocumentSheet
        type={legalSheet}
        open={!!legalSheet}
        onOpenChange={(open) => !open && setLegalSheet(null)}
      />

      {/* Register Link */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-sm text-muted-foreground pt-4 border-t border-border/50"
      >
        <p>
          {t('auth.no_account')}{' '}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-primary hover:text-primary/80 font-semibold transition-colors"
            onClick={() => navigate('/app/register')}
          >
            {t('auth.create_client_account')}
          </Button>
        </p>
      </motion.div>
    </form>
  );
};
