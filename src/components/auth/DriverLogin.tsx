import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Phone, Lock, Car, ArrowLeft, ArrowRight } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { LegalDocumentSheet } from '@/components/shared/LegalDocumentSheet';
import { logger } from '@/utils/logger';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthWithRetry } from '@/hooks/useAuthWithRetry';

interface DriverLoginProps {
  onSuccess?: () => void;
}

export const DriverLogin = ({ onSuccess }: DriverLoginProps) => {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { loginWithRetry, isPhoneInput } = useAuthWithRetry();

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

    localStorage.setItem('kwenda_login_in_progress', 'true');
    localStorage.setItem('kwenda_login_time', Date.now().toString());
    localStorage.setItem('kwenda_selected_role', 'driver');

    console.warn('[DriverLogin] → loginWithRetry | identifier:', identifier);
    const result = await loginWithRetry(identifier, password, 'driver');
    console.warn('[DriverLogin] loginWithRetry résultat | success:', result.success, '| error:', result.error ?? 'none', '| userId:', (result as any).user?.id ?? 'none');

    if (!result.success) {
      localStorage.removeItem('kwenda_login_in_progress');
      setError(result.error || 'Erreur lors de la connexion');
      setLoading(false);
      return;
    }

    // Vérifier profil chauffeur
    console.warn('[DriverLogin] → check chauffeurs | userId:', result.user.id);
    const { data: driverProfile, error: profileError } = await supabase
      .from('chauffeurs')
      .select('is_active, verification_status')
      .eq('user_id', result.user.id)
      .maybeSingle();
    console.warn('[DriverLogin] chauffeurs résultat | is_active:', driverProfile?.is_active, '| verification_status:', driverProfile?.verification_status, '| profileError:', profileError?.message ?? 'none');

    if (profileError || !driverProfile) {
      localStorage.removeItem('kwenda_login_in_progress');
      localStorage.removeItem('kwenda_selected_role');
      await supabase.auth.signOut();
      setError(t('auth.driver_profile_not_found'));
      setLoading(false);
      return;
    }

    if (!driverProfile.is_active) {
      console.warn('[DriverLogin] BLOQUÉ : is_active = false');
      localStorage.removeItem('kwenda_login_in_progress');
      localStorage.removeItem('kwenda_selected_role');
      await supabase.auth.signOut();
      setError('Votre compte chauffeur n\'est pas encore activé. Contactez le support TAGA.');
      setLoading(false);
      return;
    }

    await supabase.auth.updateUser({
      data: { active_role: 'driver', last_app: 'chauffeur' }
    });

    localStorage.setItem('kwenda_login_intent', 'driver');
    localStorage.setItem('kwenda_selected_role', 'driver');

    toast({
      title: t('auth.login_success'),
      description: t('auth.welcome_driver'),
    });

    setLoading(false);

    console.warn('[DriverLogin] → window.location.href /app/chauffeur');
    if (onSuccess) {
      onSuccess();
    } else {
      // Rechargement complet — évite que le router React évalue ProtectedRoute
      // avant que la session Supabase soit propagée dans le contexte Auth
      window.location.href = '/app/chauffeur';
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
            <Car className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary dark:text-primary">
              {t('auth.driver_space')}
            </span>
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Connexion
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t('auth.driver_subtitle')}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl animate-auth-scale">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Identifier (Phone or Email) */}
              <div className="space-y-2">
                <Label htmlFor="driver-identifier" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Téléphone ou Email
                </Label>
                <div className="relative group">
                  <IdentifierIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="driver-identifier"
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
                <Label htmlFor="driver-password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {t('auth.password')}
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="driver-password"
                    type={showPassword ? 'text' : 'password'}
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
                <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Terms */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-driver"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-0.5 flex-shrink-0 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label htmlFor="terms-driver" className="text-xs text-muted-foreground cursor-pointer leading-snug">
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
                onClick={() => navigate('/driver/register')}
                className="w-full h-11 text-primary dark:text-primary border-primary/30 dark:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 font-medium rounded-xl"
              >
                {t('auth.become_driver')}
              </Button>
              
              <p className="text-sm text-gray-500">{t('auth.not_driver')}</p>
              <div className="flex flex-wrap justify-center items-center gap-2 text-sm">
                <Link to="/app/auth" className="text-primary hover:underline font-medium">Client</Link>
                <span className="text-gray-300">•</span>
                <Link to="/partner/auth" className="text-primary hover:underline font-medium">Partenaire</Link>
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
      </div>

      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
      <LegalDocumentSheet type={legalSheet} open={!!legalSheet} onOpenChange={(open) => !open && setLegalSheet(null)} />
    </div>
  );
};
