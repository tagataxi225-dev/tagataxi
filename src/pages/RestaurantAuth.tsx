import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UtensilsCrossed, ChefHat, ArrowLeft, Phone, CheckCircle2, Info, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SUPPORTED_CITIES } from '@/constants/cities';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { AuthCard } from '@/components/auth/AuthCard';
import { LegalAcceptanceCheckbox } from '@/components/shared/LegalAcceptanceCheckbox';

export default function RestaurantAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurantName: '',
    phone: '',
    city: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  };

  const handleAuth = async () => {
    try {
      setLoading(true);
      
      console.log('🔐 [RestaurantAuth] Tentative de connexion/inscription', {
        isSignUp,
        email: formData.email,
        restaurantName: formData.restaurantName
      });
      
      if (isSignUp) {
        if (!validatePhoneNumber(formData.phone)) {
          toast.error('Le numéro de téléphone doit être au format : 0991234567 (10 chiffres)');
          return;
        }

        if (!formData.restaurantName.trim()) {
          toast.error('Le nom du restaurant est obligatoire');
          return;
        }

        if (!formData.city) {
          toast.error('Veuillez sélectionner votre ville d\'opération');
          return;
        }

        const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() ?? false;
        const redirectUrl = isCapacitor ? 'https://tagago.app/restaurant' : `${window.location.origin}/restaurant`;
        
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              restaurant_name: formData.restaurantName,
              phone: formData.phone,
              city: formData.city,
              user_type: 'restaurant'
            }
          }
        });

        if (error) throw error;

        localStorage.setItem('kwenda_login_intent', 'restaurant');
        localStorage.setItem('kwenda_selected_role', 'restaurant');

        console.log('✅ [RestaurantAuth] Inscription réussie, loginIntent défini:', {
          loginIntent: localStorage.getItem('kwenda_login_intent'),
          selectedRole: localStorage.getItem('kwenda_selected_role')
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        toast.success('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.');
        navigate('/restaurant');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        console.log('✅ [RestaurantAuth] Login successful', { userId: data.user?.id });

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session: refreshedSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !refreshedSession) {
          console.error('❌ Session non établie après connexion', sessionError);
          throw new Error('Session non établie. Veuillez réessayer.');
        }
        
        console.log('📦 Session refreshed', { 
          hasSession: !!refreshedSession,
          expiresAt: refreshedSession.expires_at
        });

        localStorage.setItem('kwenda_login_intent', 'restaurant');
        localStorage.setItem('kwenda_selected_role', 'restaurant');

        toast.success('Bienvenue ! Connexion réussie.');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        navigate('/restaurant');
      }
    } catch (error: any) {
      console.error('❌ [RestaurantAuth] Erreur:', error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AuthBackground />
      
      <div className="w-full max-w-md space-y-4 relative z-10">
        <AuthCard delay={0.15}>
          {/* Header modernisé */}
          <div className="text-center space-y-4 mb-6">
            <div className="relative mx-auto w-18 h-18">
              <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-pulse scale-125" />
              <div className="relative w-18 h-18 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/30 ring-offset-2 ring-offset-background">
                <ChefHat className="w-9 h-9 text-white" />
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 tracking-wide uppercase">
                Espace Restaurant
              </span>
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignUp ? 'Devenir Restaurant Partenaire' : 'TAGA Food'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp 
                ? 'Rejoignez notre réseau et développez votre activité'
                : 'Gérez votre restaurant et vos commandes'
              }
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {isSignUp && (
              <>
                {/* Nom du restaurant avec icône */}
                <div className="relative">
                  <UtensilsCrossed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Nom du restaurant"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
                
                {/* Téléphone */}
                <div className="space-y-2">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder="0991234567"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, phone: value });
                        setPhoneValid(validatePhoneNumber(value));
                      }}
                      className={cn(
                        "pl-10 pr-10",
                        phoneValid && "border-green-500 focus-visible:ring-green-500"
                      )}
                      required
                    />
                    {phoneValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Format: 0XXXXXXXXX (10 chiffres)
                  </p>
                </div>

                {/* Ville - Chips sélectionnables */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ville d'opération *</Label>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_CITIES.map(city => (
                      <button
                        key={city.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, city: city.value })}
                        className={cn(
                          "px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200",
                          formData.city === city.value
                            ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25"
                            : "bg-background border-border text-muted-foreground hover:border-orange-300 hover:text-foreground"
                        )}
                      >
                        {city.emoji} {city.value}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {isSignUp && (
              <LegalAcceptanceCheckbox
                checked={acceptTerms}
                onCheckedChange={setAcceptTerms}
                accentColor="orange"
              />
            )}

            <Button 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-200" 
              onClick={handleAuth}
              disabled={loading || (isSignUp && !acceptTerms)}
            >
              <ChefHat className="w-4 h-4 mr-2" />
              {isSignUp ? 'Créer mon restaurant' : 'Se connecter'}
            </Button>

            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => { setIsSignUp(!isSignUp); setAcceptTerms(false); }}
            >
              {isSignUp 
                ? 'Déjà inscrit ? Se connecter' 
                : 'Nouveau restaurant ? S\'inscrire'
              }
            </button>

            {/* Liens vers autres espaces - compact */}
            <div className="text-center pt-2 text-sm">
              <span className="text-muted-foreground">Pas restaurant ? </span>
              <Link to="/app/auth" className="auth-link">Client</Link>
              <span className="text-muted-foreground/50 mx-1.5">•</span>
              <Link to="/driver/auth" className="auth-link">Chauffeur</Link>
            </div>
          </div>
        </AuthCard>

        {/* Footer simplifié */}
        <div className="flex justify-center pb-6">
          <Button 
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
