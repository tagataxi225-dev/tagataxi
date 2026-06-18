import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UtensilsCrossed, Mail, Lock, Phone, CheckCircle2, Info } from 'lucide-react';
import { LegalDocumentSheet } from '@/components/shared/LegalDocumentSheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export const RestaurantLoginForm = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    restaurantName: '',
    phone: ''
  });

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
  };

  const handleAuth = async () => {
    try {
      setLoading(true);
      
      if (isSignUp && !acceptTerms) {
        toast.error(t('auth.must_accept_terms'));
        setLoading(false);
        return;
      }
      
      if (isSignUp) {
        if (!validatePhoneNumber(formData.phone)) {
          toast.error('Le numéro de téléphone doit être au format : 0991234567 (10 chiffres)');
          return;
        }

        if (!formData.restaurantName.trim()) {
          toast.error('Le nom du restaurant est obligatoire');
          return;
        }

        // Compatible mobile Capacitor
        const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() ?? false;
        const redirectUrl = isCapacitor ? 'https://tembea.app/restaurant' : `${window.location.origin}/restaurant`;

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              restaurant_name: formData.restaurantName,
              phone: formData.phone,
              user_type: 'restaurant'
            }
          }
        });

        if (error) throw error;

        localStorage.setItem('kwenda_login_intent', 'restaurant');
        localStorage.setItem('kwenda_selected_role', 'restaurant');
        
        await new Promise(resolve => setTimeout(resolve, 100));

        toast.success('Compte créé ! Vérifiez votre email.');
        navigate('/restaurant');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session: refreshedSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !refreshedSession) {
          throw new Error('Session non établie. Veuillez réessayer.');
        }

        localStorage.setItem('kwenda_login_intent', 'restaurant');
        localStorage.setItem('kwenda_selected_role', 'restaurant');

        toast.success('Connexion réussie !');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        navigate('/restaurant');
      }
    } catch (error: any) {
      console.error('❌ Erreur auth restaurant:', error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mb-4">
          <UtensilsCrossed className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-heading-lg">
          {isSignUp ? 'Devenir Restaurant Partenaire' : 'Espace Restaurant'}
        </h2>
        <p className="text-body-sm text-muted-foreground">
          {isSignUp 
            ? 'Rejoignez TAGA Food et développez votre activité'
            : 'Connectez-vous pour gérer votre restaurant'
          }
        </p>
      </div>

      <div className="space-y-4">
        {isSignUp && (
          <>
            <Input
              placeholder="Nom du restaurant"
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              required
            />
            
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
          </>
        )}

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

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="pl-10"
          />
        </div>

        {isSignUp && (
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms-restaurant"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              className="mt-0.5 flex-shrink-0"
            />
            <Label htmlFor="terms-restaurant" className="text-xs text-muted-foreground cursor-pointer leading-snug">
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
        )}

        <Button
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500" 
          onClick={handleAuth}
          disabled={loading || (isSignUp && !acceptTerms)}
        >
          <UtensilsCrossed className="w-4 h-4 mr-2" />
          {isSignUp ? 'Créer mon restaurant' : 'Se connecter'}
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp 
            ? 'Déjà inscrit ? Se connecter' 
            : 'Nouveau restaurant ? S\'inscrire'
          }
        </Button>
      </div>
      <LegalDocumentSheet type={legalSheet} open={!!legalSheet} onOpenChange={(open) => !open && setLegalSheet(null)} />
    </div>
  );
};
