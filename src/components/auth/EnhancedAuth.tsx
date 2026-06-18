import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { RoleSelectionPage } from './RoleSelectionPage';
import { ClientRegistrationForm } from './forms/ClientRegistrationForm';
import { DriverRegistrationChoice } from '@/components/driver/registration/DriverRegistrationChoice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock, Sparkles } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { AuthStatusChecker } from './AuthStatusChecker';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { logger } from '@/utils/logger';

type AuthStep = 'login' | 'role-selection' | 'registration';

export const EnhancedAuth = () => {
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

  const { user } = useAuth();
  const { userRole, loading: roleLoading, getRedirectPath } = useRoleBasedAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Rediriger si l'utilisateur est déjà connecté et a un rôle
  useEffect(() => {
    if (user && userRole && !roleLoading) {
      const redirectPath = getRedirectPath(userRole.role);
      navigate(redirectPath);

      logger.info('User authenticated', { userId: user?.id, role: userRole });
    }
  }, [user, userRole, roleLoading, navigate, getRedirectPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });

      if (error) {
        logger.error('Login error', error);
        throw error;
      }

      // Récupérer l'utilisateur connecté
      const user = data.user;

      if (user) {
        // La redirection sera gérée par useEffect avec useRoleBasedAuth
        toast({
          title: "Connexion réussie !",
          description: "Redirection en cours...",
        });
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
    // Pour les chauffeurs/livreurs, aller directement au formulaire d'inscription
    if (role === 'taxi_driver' || role === 'delivery_driver') {
      setStep('registration');
    } else {
      setStep('registration');
    }
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

  const handleBackToLogin = () => {
    setStep('login');
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
    // Pour les autres rôles (admin, partenaire), on peut les ajouter plus tard
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Formulaire en développement</CardTitle>
            <CardDescription>
              Le formulaire pour ce type de compte sera bientôt disponible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackToRoleSelection} className="w-full">
              Retour au choix du rôle
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Page de connexion/inscription
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Arrière-plan dynamique avec dominante rouge */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-red-500/15 to-rose-500/20 dark:from-red-700/30 dark:via-red-600/25 dark:to-rose-600/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(220,38,38,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(220,38,38,0.25),transparent_50%)]" />
      
      {/* Formes géométriques rouge intense */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-red-500/15 dark:bg-red-600/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-red-600/15 dark:bg-red-700/25 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-rose-500/15 dark:bg-rose-600/25 rounded-full blur-2xl animate-pulse delay-500" />

      <div className="w-full max-w-md relative z-10">
        {/* En-tête impactant avec logo Tembea */}
        <div className="text-center mb-8 space-y-4 animate-fade-in">
          {/* Logo dynamique dans fond noir */}
          <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-white dark:bg-card shadow-2xl shadow-red-600/50 dark:shadow-red-500/60 mb-6 ring-2 ring-red-500/40 dark:ring-red-400/50 overflow-hidden group cursor-pointer hover:scale-105 transition-all duration-500">
            {/* Gradient animé en arrière-plan */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-red-500/20 animate-pulse" />
            
            {/* Effet de lueur rotative */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/30 to-transparent animate-[slide-in-right_3s_ease-in-out_infinite]" />
            
            {/* Logo avec animation subtile */}
            <BrandLogo 
              size={80} 
              className="relative z-10 animate-float" 
            />
          </div>
          
          <h1 className="text-6xl font-bold animate-gradient bg-gradient-to-r from-red-700 via-red-600 to-red-500 dark:from-red-500 dark:via-red-400 dark:to-rose-400 bg-clip-text text-transparent mb-2 tracking-tight drop-shadow-lg">
            TAGA
          </h1>
          
          <p className="text-base text-gray-700 dark:text-gray-200 drop-shadow-sm">
            Courses abordables tous les jours.
          </p>
        </div>

        {/* Carte de connexion ultra-moderne avec glass-morphism */}
        <Card className="relative shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-card/80 border-white/20 dark:border-border/20 overflow-hidden animate-scale-in">
          {/* Bordure lumineuse gradient rouge */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/25 via-red-500/20 to-rose-500/25 dark:from-red-500/35 dark:via-red-600/30 dark:to-rose-500/35 opacity-50 pointer-events-none" />
          
          <CardContent className="pt-8 pb-6 relative z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Onglets modernisés avec transition fluide */}
              <TabsList className="grid w-full grid-cols-2 mb-8 p-1.5 bg-gray-100/80 dark:bg-muted/80 backdrop-blur-sm rounded-xl shadow-inner">
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
                  {/* Champ Email avec icône et effet focus lumineux */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-gray-100">
                      Adresse email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-600 dark:group-focus-within:text-red-500 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                        className="h-14 pl-12 pr-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-red-600 dark:focus:border-red-500 focus:ring-4 focus:ring-red-600/25 dark:focus:ring-red-500/25 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
                      />
                    </div>
                  </div>

                  {/* Champ Mot de passe avec icône et effet focus lumineux */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-bold text-gray-700 dark:text-gray-100">
                      Mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-600 dark:group-focus-within:text-red-500 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        className="h-14 pl-12 pr-14 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl text-base font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-red-600 dark:focus:border-red-500 focus:ring-4 focus:ring-red-600/25 dark:focus:ring-red-500/25 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Message d'erreur élégant */}
                  {error && (
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-sm font-medium text-red-700 dark:text-red-300">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Bouton CTA premium avec gradient animé */}
                  <Button 
                    type="submit" 
                    className="relative w-full h-14 bg-gradient-to-r from-red-600 via-red-500 to-rose-500 hover:from-red-700 hover:via-red-600 hover:to-rose-600 dark:from-red-600 dark:via-red-500 dark:to-rose-500 dark:hover:from-red-500 dark:hover:via-red-400 dark:hover:to-rose-400 text-white text-base font-bold rounded-xl shadow-xl shadow-red-600/50 dark:shadow-red-500/50 hover:shadow-2xl hover:shadow-red-600/60 dark:hover:shadow-red-500/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group" 
                    disabled={loading}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      {loading ? 'Connexion...' : 'Se connecter'}
                    </span>
                    {/* Effet de brillance au hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </Button>

                  {/* Lien mot de passe oublié redesigné */}
                  <div className="flex items-center justify-center pt-2">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold underline-offset-4 hover:underline transition-all"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Mot de passe oublié ?
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-6 animate-fade-in">
                <div className="text-center space-y-6 py-6">
                  {/* Badge d'inscription moderne */}
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

            {/* Séparateur élégant */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
            </div>

            <div className="space-y-4">
              <AuthStatusChecker compact />
              
              {/* Bouton retour amélioré */}
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