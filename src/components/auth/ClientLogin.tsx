import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { RoleSelectionPage } from './RoleSelectionPage';
import { ClientRegistrationForm } from './forms/ClientRegistrationForm';
import { DriverRegistrationChoice } from '@/components/driver/registration/DriverRegistrationChoice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock, Sparkles, UserCircle2, ArrowRight } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { AuthStatusChecker } from './AuthStatusChecker';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { logger } from '@/utils/logger';
import { Link } from 'react-router-dom';

type AuthStep = 'login' | 'role-selection' | 'registration';

export const ClientLogin = () => {
  const [step, setStep] = useState<AuthStep>('login');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { user, session, sessionReady } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fonction de redirection unifiée qui gère les deux conventions de rôles
  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/operatorx/admin';
      case 'partner':
      case 'partenaire':
        return '/app/partenaire';
      case 'driver':
      case 'chauffeur':
        return '/app/chauffeur';
      case 'client':
      case 'simple_user_client':
      default:
        return '/app/client';
    }
  };

  // ✅ CORRIGÉ : Redirection avec sessionReady et loginIntent
  useEffect(() => {
    console.log('🔍 [ClientLogin] Auth state', { 
      hasUser: !!user, 
      hasSession: !!session, 
      primaryRole, 
      roleLoading,
      sessionReady
    });

    // ✅ Attendre que TOUT soit chargé
    if (roleLoading || !sessionReady) {
      console.log('⏳ [ClientLogin] Waiting for roles/session...');
      return;
    }
    
    // Si pas connecté, ne rien faire
    if (!user || !session) return;
    
    // ✅ Vérifier loginIntent pour éviter redirection prématurée
    const loginIntent = localStorage.getItem('kwenda_login_intent');
    
    // Si rôle chargé ET loginIntent = 'client', rediriger
    if (primaryRole && loginIntent === 'client') {
      const redirectPath = getRedirectPath(primaryRole);
      console.log('🚀 [ClientLogin] Redirecting to', redirectPath);
      
      // Nettoyer loginIntent après usage
      localStorage.removeItem('kwenda_login_intent');
      
      navigate(redirectPath, { replace: true });
    }
  }, [user, session, primaryRole, roleLoading, sessionReady, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      logger.info('🔐 Attempting login for:', loginForm.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });

      if (error) {
        logger.error('❌ Login error', error);
        throw error;
      }

      logger.info('✅ Login successful', { userId: data.user?.id, hasSession: !!data.session });

      // ✅ CORRECTION : Attendre stabilisation session (augmenter à 1000ms)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ✅ CORRECTION : Forcer refresh session + attendre confirmation
      const { data: { session: refreshedSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !refreshedSession) {
        logger.error('❌ Session non établie après connexion', sessionError);
        throw new Error('Session non établie. Veuillez réessayer.');
      }
      
      logger.info('📦 Session refreshed', { 
        hasSession: !!refreshedSession,
        expiresAt: refreshedSession.expires_at,
        userId: data.user?.id
      });

      const user = data.user;

      if (user) {
        // ✅ CORRECTION : Vérifier rôle avec retry si échec
        let roles;
        let retries = 3;
        
        while (retries > 0) {
          const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles', {
            p_user_id: user.id
          });

          if (!rolesError && rolesData) {
            roles = rolesData;
            logger.info('✅ Roles verified:', {
              roles: roles.map((r: any) => r.role)
            });
            break;
          }
          
          if (rolesError?.message?.includes('JWT') || rolesError?.message?.includes('session')) {
            // Retry si erreur de session
            retries--;
            await new Promise(resolve => setTimeout(resolve, 500));
            logger.warn(`⚠️ Retry get_user_roles (${3 - retries}/3)`);
            continue;
          }
          
          throw rolesError || new Error('Erreur lors de la vérification du rôle');
        }

        if (!roles || roles.length === 0) {
          throw new Error('Aucun rôle trouvé pour ce compte');
        }

        const hasClientRole = roles.some((r: any) => r.role === 'client');

        if (!hasClientRole) {
          // Rediriger vers la bonne page selon le rôle
          const otherRole = roles[0]?.role;
          
          // Nettoyage localStorage avant signOut conditionnel
          localStorage.removeItem('kwenda_login_intent');
          localStorage.removeItem('kwenda_selected_role');
          localStorage.removeItem('kwenda_user_roles_cache');
          await supabase.auth.signOut();
          
          if (otherRole === 'driver') {
            setError('Ce compte est un compte chauffeur. Connectez-vous via l\'espace chauffeur.');
            toast({
              title: "Mauvais espace de connexion",
              description: "Redirection vers l'espace chauffeur...",
              variant: "destructive"
            });
            setTimeout(() => navigate('/driver/auth'), 2000);
          } else if (otherRole === 'partner') {
            setError('Ce compte est un compte partenaire. Connectez-vous via l\'espace partenaire.');
            setTimeout(() => navigate('/partner/auth'), 2000);
          } else if (otherRole === 'admin') {
            setError('Ce compte est un compte admin. Connectez-vous via l\'espace admin.');
            setTimeout(() => navigate('/operatorx/admin/auth'), 2000);
          } else {
            setError('Aucun rôle client trouvé pour ce compte.');
          }
          
          setLoading(false);
          return;
        }

        // ✅ CORRECTION : Stocker loginIntent pour redirection correcte
        localStorage.setItem('kwenda_login_intent', 'client');
        localStorage.setItem('kwenda_selected_role', 'client');

        toast({
          title: "Connexion réussie !",
          description: "Redirection en cours...",
        });

        // ✅ CORRECTION : Attendre 300ms pour garantir synchronisation useAuth/useUserRoles
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // La redirection sera gérée par useEffect avec useUserRoles
      }
    } catch (error: any) {
      logger.error("Login error", error);
      setError(error.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
    setStep('registration');
  };

  const handleRegistrationSuccess = () => {
    toast({
      title: "Inscription réussie !",
      description: "Vous pouvez maintenant vous connecter",
    });
    setStep('login');
    setActiveTab('login');
  };

  const handleBackToRoleSelection = () => {
    setStep('role-selection');
  };


  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-800">Connexion en cours...</p>
            <p className="text-sm text-gray-500">Vérification de votre compte</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'role-selection') {
    return <RoleSelectionPage onRoleSelect={handleRoleSelection} />;
  }

  if (step === 'registration') {
    if (selectedRole === 'simple_user_client') {
      return (
        <ClientRegistrationForm
          onSuccess={handleRegistrationSuccess}
          onBack={handleBackToRoleSelection}
        />
      );
    }
    if (selectedRole === 'taxi_driver' || selectedRole === 'delivery_driver') {
      return (
        <DriverRegistrationChoice
          onSuccess={handleRegistrationSuccess}
          onBack={handleBackToRoleSelection}
        />
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <Button onClick={handleBackToRoleSelection} className="w-full">
              Retour au choix du rôle
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Page de connexion client
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 dark:from-background dark:to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        {/* En-tête */}
        <div className="text-center mb-8 space-y-5 animate-fade-in">
          <div className="flex justify-center">
            <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <BrandLogo size={56} />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <UserCircle2 className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400">Espace Client</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Connexion
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Courses abordables tous les jours
            </p>
          </div>
        </div>

        {/* Carte de connexion professionnelle */}
        <Card className="shadow-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-scale-in">
          
          <CardContent className="pt-8 pb-6 relative z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8 p-1.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-inner">
                <TabsTrigger 
                  value="login"
                  className="relative rounded-lg font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-600/60 dark:data-[state=active]:shadow-red-500/60 data-[state=active]:scale-[1.02]"
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="relative rounded-lg font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-600/60 dark:data-[state=active]:shadow-red-500/60 data-[state=active]:scale-[1.02]"
                >
                  Inscription
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
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
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                        className="h-12 pl-10 pr-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                   <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                      Mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        className="h-12 pl-10 pr-12 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
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

                  {error && (
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-sm font-medium text-red-700 dark:text-red-300">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                   <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Connexion...' : 'Se connecter'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>

                  <div className="flex items-center justify-center pt-2">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium underline-offset-4 hover:underline"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Mot de passe oublié ?
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-6 animate-fade-in">
                <div className="text-center space-y-6 py-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 border-2 border-red-300 dark:border-red-700/60">
                    <Sparkles className="w-4 h-4 text-red-700 dark:text-red-400" />
                    <span className="text-sm font-bold text-red-800 dark:text-red-300">
                      Rejoignez-nous gratuitement
                    </span>
                  </div>

                  <div className="p-8 rounded-2xl bg-gradient-to-br from-red-50 via-rose-50 to-red-100 dark:from-red-900/25 dark:via-rose-900/25 dark:to-red-900/30 border-2 border-red-200 dark:border-red-800/60 backdrop-blur-sm">
                    <p className="text-base text-gray-800 dark:text-gray-100 font-semibold mb-6 leading-relaxed">
                      Choisissez votre profil et commencez<br/>
                      votre aventure TAGA ! 🚀
                    </p>
                    <Button
                      onClick={() => setStep('role-selection')}
                      className="relative w-full h-14 bg-gradient-to-r from-red-600 via-red-500 to-rose-500 hover:from-red-700 hover:via-red-600 hover:to-rose-600 dark:from-red-600 dark:via-red-500 dark:to-rose-500 dark:hover:from-red-500 dark:hover:via-red-400 dark:hover:to-rose-400 text-white text-base font-bold rounded-xl shadow-xl shadow-red-600/50 dark:shadow-red-500/50 hover:shadow-2xl hover:shadow-red-600/60 dark:hover:shadow-red-500/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group"
                    >
                      <span className="relative z-10">Créer mon compte</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Séparateur */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
            </div>

            <div className="space-y-4">
              <AuthStatusChecker compact />
              
              {/* Footer avec liens vers autres espaces */}
              <div className="text-center space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-muted-foreground">
                  Pas client ?
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-sm">
                  <Link to="/driver/auth" className="text-red-600 dark:text-red-400 hover:underline font-medium">
                    Espace Chauffeur
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link to="/partner/auth" className="text-red-600 dark:text-red-400 hover:underline font-medium">
                    Espace Partenaire
                  </Link>
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  ← Retour à l'accueil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};
