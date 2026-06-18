import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, Mail, Lock } from 'lucide-react';
import { useAuthWithRetry } from '@/hooks/useAuthWithRetry';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { LegalDocumentSheet } from '@/components/shared/LegalDocumentSheet';

export const PartnerLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);

  const navigate = useNavigate();
  const { loginWithRetry } = useAuthWithRetry();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      setError(t('auth.must_accept_terms'));
      return;
    }
    
    setLoading(true);
    setError(null);

    const result = await loginWithRetry(email, password, 'partner');

    if (!result.success) {
      setError(result.error || 'Erreur lors de la connexion');
      setLoading(false);
      return;
    }

    localStorage.setItem('kwenda_login_intent', 'partner');

    toast.success('Connexion réussie !', {
      description: 'Bienvenue dans votre espace partenaire'
    });

    await new Promise(resolve => setTimeout(resolve, 300));
    
    setLoading(false);
    navigate('/app/partenaire');
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="partner-email" className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Adresse email
        </Label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            id="partner-email"
            type="email"
            placeholder="partenaire@entreprise.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 pl-10 pr-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="partner-password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Mot de passe
        </Label>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            id="partner-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 pl-10 pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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

      {error && (
        <Alert variant="destructive" className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 rounded-xl animate-fade-in">
          <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-sm text-emerald-700 dark:text-emerald-300">{error}</AlertDescription>
        </Alert>
      )}

      {/* Acceptation CGU */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms-partner"
          checked={acceptTerms}
          onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
          className="mt-0.5 flex-shrink-0 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        />
        <Label htmlFor="terms-partner" className="text-xs text-muted-foreground cursor-pointer leading-snug">
          J'accepte les{' '}
          <button type="button" onClick={() => setLegalSheet('terms')} className="text-emerald-500 font-medium hover:underline">
            conditions générales d'utilisation
          </button>{' '}
          et la{' '}
          <button type="button" onClick={() => setLegalSheet('privacy')} className="text-emerald-500 font-medium hover:underline">
            politique de confidentialité
          </button>{' '}
          de TAGA.
        </Label>
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
        disabled={loading || !acceptTerms}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Connexion...' : 'Se connecter'}
      </Button>

      <div className="flex items-center justify-center pt-2">
        <Button
          type="button"
          variant="link"
          className="text-sm text-emerald-500 hover:text-emerald-600 p-0 h-auto"
          onClick={() => navigate('/forgot-password')}
        >
          Mot de passe oublié ?
        </Button>
      </div>

      <div className="text-center text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <p>
          Pas encore partenaire ?{' '}
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-emerald-500 hover:text-emerald-600 font-medium"
            onClick={() => navigate('/partner/register')}
          >
            Rejoindre le réseau
          </Button>
        </p>
      </div>
      <LegalDocumentSheet
        type={legalSheet}
        open={!!legalSheet}
        onOpenChange={(open) => !open && setLegalSheet(null)}
      />
    </form>
  );
};