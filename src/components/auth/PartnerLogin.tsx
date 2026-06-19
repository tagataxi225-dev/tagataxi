import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Briefcase, Lock, Eye, EyeOff, Mail, Phone, AlertCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { LegalDocumentSheet } from '@/components/shared/LegalDocumentSheet';
import { logger } from '@/utils/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthWithRetry } from '@/hooks/useAuthWithRetry';

interface PartnerLoginProps {
  onSuccess?: () => void;
}

export const PartnerLogin = ({ onSuccess }: PartnerLoginProps) => {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);
  const navigate = useNavigate();
  const { loginWithRetry, isPhoneInput } = useAuthWithRetry();

  const isPhone = isPhoneInput(identifier);
  const IdentifierIcon = isPhone ? Phone : Mail;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      setError(t('auth.must_accept_terms'));
      return;
    }
    
    if (!identifier || !password) {
      setError(t('auth.fill_all_fields'));
      return;
    }

    setLoading(true);
    setError(null);

    localStorage.setItem('kwenda_login_in_progress', 'true');
    localStorage.setItem('kwenda_selected_role', 'partner');

    const result = await loginWithRetry(identifier, password, 'partner');

    if (!result.success) {
      localStorage.removeItem('kwenda_login_in_progress');
      setError(result.error || t('auth.check_credentials'));
      setLoading(false);
      return;
    }

    localStorage.setItem('kwenda_login_intent', 'partner');
    localStorage.setItem('kwenda_selected_role', 'partner');

    toast.success(t('auth.login_success'), {
      description: t('auth.welcome_partner')
    });

    localStorage.removeItem('kwenda_login_in_progress');
    setLoading(false);
    
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/app/partenaire');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white dark:from-background dark:via-emerald-950/10 dark:to-background flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md animate-auth-fade">
        {/* Header */}
        <div className="text-center mb-8 space-y-5">
          <div className="flex justify-center">
            <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <BrandLogo size={56} />
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/20 dark:border-primary/30">
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary dark:text-primary">
              {t('auth.partner_space')}
            </span>
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Connexion
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t('auth.partner_subtitle')}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl animate-auth-scale">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Identifier (Phone or Email) */}
              <div className="space-y-2">
                <Label htmlFor="partner-identifier" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Téléphone ou Email
                </Label>
                <div className="relative group">
                  <IdentifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="partner-identifier"
                    type="text"
                    placeholder="Téléphone ou email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-12 pl-10 pr-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                {isPhone && identifier.length > 2 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Connexion par téléphone
                  </p>
                )}
              </div>
              
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="partner-password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('auth.password')}
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="partner-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-10 pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive" className="bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 rounded-xl animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <AlertDescription className="text-sm text-rose-700 dark:text-rose-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Terms */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-partner"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-0.5 flex-shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label htmlFor="terms-partner" className="text-xs text-muted-foreground cursor-pointer leading-snug">
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
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                disabled={loading || !acceptTerms}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? t('auth.logging_in') : t('auth.login_button')}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>

              {/* Forgot Password */}
              <div className="flex items-center justify-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm text-primary hover:text-primary/80 p-0 h-auto"
                  onClick={() => setShowForgotPassword(true)}
                >
                  {t('auth.forgot_password')}
                </Button>
              </div>
            </form>

            {/* Footer Links */}
            <div className="text-center mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <Button
                variant="outline"
                onClick={() => navigate('/partner/register')}
                className="w-full h-11 text-primary dark:text-primary border-primary/30 dark:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 font-medium rounded-xl"
              >
                {t('auth.become_partner')}
              </Button>
              
              <p className="text-sm text-gray-500">{t('auth.not_partner')}</p>
              <div className="flex flex-wrap justify-center items-center gap-2 text-sm">
                <Link to="/app/auth" className="text-primary hover:underline font-medium">Client</Link>
                <span className="text-gray-300">•</span>
                <Link to="/driver/auth" className="text-primary hover:underline font-medium">Chauffeur</Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 mr-1.5" />
            Retour à l'accueil
          </Button>
        </div>

        <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
        <LegalDocumentSheet type={legalSheet} open={!!legalSheet} onOpenChange={(open) => !open && setLegalSheet(null)} />
      </div>
    </div>
  );
};
