import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LegalAcceptanceCheckbox } from '@/components/shared/LegalAcceptanceCheckbox';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Mail, Lock, User, ArrowLeft, Gift } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { AuthCard } from '@/components/auth/AuthCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
} as const;

/**
 * Page d'inscription client dédiée
 * Gère le code de parrainage via ?ref= dans l'URL
 */
const ClientRegister = () => {
  const [searchParams] = useSearchParams();
  const referralCodeFromUrl = searchParams.get('ref')?.toUpperCase() || '';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: referralCodeFromUrl
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [referralValidated, setReferralValidated] = useState<boolean | null>(null);
  

  const navigate = useNavigate();

  // Valider le code de parrainage si présent dans l'URL
  useEffect(() => {
    if (referralCodeFromUrl) {
      validateReferralCode(referralCodeFromUrl);
    }
  }, [referralCodeFromUrl]);

  const validateReferralCode = async (code: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_referral_code', {
        p_referral_code: code.trim().toUpperCase()
      });
      if (!error && data && (data as any).valid) {
        setReferralValidated(true);
      } else {
        setReferralValidated(false);
      }
    } catch {
      setReferralValidated(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation');
      setLoading(false);
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      // Compatible mobile Capacitor
      const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() ?? false;
      const redirectUrl = isCapacitor ? 'https://tembea.app/app/client' : `${window.location.origin}/app/client`;
      
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.name,
            user_type: 'client'
          }
        }
      });

      if (error) throw error;

      // Appliquer le code de parrainage si présent et que l'inscription a réussi
      if (formData.referralCode && signUpData.user) {
        try {
          const { error: refError } = await supabase.rpc('apply_referral_code', {
            p_referee_id: signUpData.user.id,
            p_referral_code: formData.referralCode.toUpperCase()
          });
          
          if (refError) {
            console.warn('⚠️ Parrainage non appliqué:', refError.message);
          } else {
            toast.success('Bonus de parrainage appliqué ! 🎁', {
              description: 'Vous recevrez 500 CDF de bonus'
            });
          }
        } catch (refErr) {
          console.warn('⚠️ Erreur parrainage:', refErr);
        }
      }

      toast.success('Inscription réussie !', {
        description: 'Vérifiez votre email pour confirmer votre compte'
      });

      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="min-h-dvh flex flex-col relative pt-safe-top"
    >
      <AuthBackground />

      <div className="flex-1 flex items-center justify-center p-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md flex flex-col space-y-5"
        >
          {/* Back button */}
          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5 group-hover:-translate-x-1 transition-transform" />
              Retour à la connexion
            </Button>
          </motion.div>

          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative p-3 bg-white dark:bg-card rounded-2xl shadow-lg border border-white/50 dark:border-border/50">
                <BrandLogo size={56} />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-rose-800 to-gray-900 dark:from-white dark:via-rose-200 dark:to-white bg-clip-text text-transparent">
              Rejoignez Tembea
            </h1>
            <p className="text-sm text-muted-foreground">
              Créez votre compte et profitez de courses abordables
            </p>
          </motion.div>

          {/* Form Card */}
          <AuthCard delay={0.3}>
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Nom complet */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                  Nom complet
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Mwamba Kabongo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-12 pl-10 pr-4"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                  Adresse email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12 pl-10 pr-4"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                  Mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-12 pl-10 pr-4"
                  />
                </div>
              </div>

              {/* Confirmation mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                  Confirmer le mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="h-12 pl-10 pr-4"
                  />
                </div>
              </div>

              {/* Code de parrainage */}
              <div className="space-y-2">
                <Label htmlFor="referralCode" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                  Code de parrainage (optionnel)
                </Label>
                <div className="relative group">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Ex: KWAB1234"
                    value={formData.referralCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFormData({ ...formData, referralCode: val });
                      if (val.length >= 4) validateReferralCode(val);
                      else setReferralValidated(null);
                    }}
                    className="h-12 pl-10 pr-4"
                  />
                </div>
                {referralValidated === true && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Gift className="h-3 w-3" /> Code valide — vous recevrez 500 CDF de bonus !
                  </p>
                )}
                {referralValidated === false && formData.referralCode && (
                  <p className="text-xs text-destructive">Code invalide ou expiré</p>
                )}
              </div>

              {/* Message d'erreur */}
              {error && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-sm font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Acceptation CGU */}
              <LegalAcceptanceCheckbox
                checked={acceptTerms}
                onCheckedChange={setAcceptTerms}
                accentColor="red"
                id="terms-register"
              />

              {/* Bouton d'inscription */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold"
                disabled={loading || !acceptTerms}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </Button>

              {/* Lien vers la connexion */}
              <div className="text-center pt-4">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm auth-link"
                  onClick={() => navigate('/auth')}
                >
                  Déjà inscrit ? Se connecter
                </Button>
              </div>
            </form>
          </AuthCard>

        </motion.div>
      </div>
    </motion.div>
  );
};

export default ClientRegister;
