import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, CheckCircle2, Info, Gift, ArrowLeft, User, Mail, Lock, Calendar, MapPin, XCircle, AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import BrandLogo from '@/components/brand/BrandLogo';
import { LegalDocumentSheet } from '@/components/shared/LegalDocumentSheet';

interface ClientRegistrationFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

interface ReferralValidation {
  valid: boolean;
  message?: string;
  referrer_name?: string;
  remaining_slots?: number;
  reward_amount?: number;
  limit_reached?: boolean;
}

export const ClientRegistrationForm = ({ onSuccess, onBack }: ClientRegistrationFormProps) => {
  const [loading, setLoading] = useState(false);
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [phoneValid, setPhoneValid] = useState(false);
  
  // État pour la validation du code de parrainage
  const [referralValidation, setReferralValidation] = useState<ReferralValidation | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    address: '',
    city: 'Kinshasa',
    referralCode: '',
    acceptTerms: false
  });

  // Fonction pour valider le code de parrainage
  const validateReferralCode = useCallback(async (code: string) => {
    if (!code || code.trim().length < 4) {
      setReferralValidation(null);
      return;
    }

    setValidatingCode(true);
    try {
      const { data, error } = await supabase.rpc('validate_referral_code', {
        p_referral_code: code.trim().toUpperCase()
      });

      if (error) {
        console.error('❌ Error validating code:', error);
        setReferralValidation({ valid: false, message: 'Erreur de validation' });
      } else {
        const result = data as unknown as ReferralValidation;
        setReferralValidation({
          valid: result.valid === true,
          message: result.message,
          referrer_name: result.referrer_name,
          remaining_slots: result.remaining_slots,
          reward_amount: result.reward_amount,
          limit_reached: result.limit_reached
        });
      }
    } catch (err) {
      console.error('❌ Exception validating code:', err);
      setReferralValidation({ valid: false, message: 'Erreur de connexion' });
    } finally {
      setValidatingCode(false);
    }
  }, []);

  // Debounce pour la validation du code
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.referralCode.length >= 4) {
        validateReferralCode(formData.referralCode);
      } else {
        setReferralValidation(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.referralCode, validateReferralCode]);

  // Lire le code parrainage depuis l'URL au chargement
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      console.log('🎁 Referral code from URL:', refCode);
      setFormData(prev => ({ ...prev, referralCode: refCode.toUpperCase() }));
    }
  }, [searchParams]);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+243|00243|0)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: t('common.error'), description: t('auth.passwords_no_match'), variant: "destructive" });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: t('common.error'), description: t('auth.password_min_length'), variant: "destructive" });
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      toast({ title: t('common.error'), description: t('auth.invalid_phone_format'), variant: "destructive" });
      return;
    }

    if (!formData.acceptTerms) {
      toast({ title: t('common.error'), description: t('auth.must_accept_terms'), variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Compatible mobile Capacitor
      const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() ?? false;
      const redirectUrl = isCapacitor ? 'https://tembea.app/client/verify-email' : `${window.location.origin}/client/verify-email`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            user_type: 'client',
            display_name: formData.displayName,
            phone_number: formData.phoneNumber,
            date_of_birth: formData.dateOfBirth,
            gender: formData.gender,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            address: formData.address,
            city: formData.city
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'create_client_profile_secure',
          {
            p_user_id: authData.user.id,
            p_email: formData.email,
            p_display_name: formData.displayName,
            p_phone_number: formData.phoneNumber,
            p_date_of_birth: formData.dateOfBirth || null,
            p_gender: formData.gender || null,
            p_address: formData.address || null,
            p_city: formData.city || 'Kinshasa',
            p_emergency_contact_name: formData.emergencyContactName || null,
            p_emergency_contact_phone: formData.emergencyContactPhone || null
          }
        );

        const result = rpcResult as any;
        if (rpcError || !result?.success) {
          logger.error('Client profile creation failed', rpcError || result);
          throw new Error(result?.error || t('auth.profile_creation_error'));
        }

        if (formData.referralCode && formData.referralCode.trim() !== '') {
          const { data: refResult, error: refError } = await supabase.rpc(
            'apply_referral_code',
            {
              p_referee_id: authData.user.id,
              p_referral_code: formData.referralCode.trim().toUpperCase()
            }
          );

          if (refError) {
            toast({ title: 'Attention', description: 'Code de parrainage invalide. Inscription réussie mais sans bonus.' });
          } else if ((refResult as any)?.success) {
            toast({ title: '🎉 Bonus de parrainage !', description: 'Vous avez reçu 500 CDF de bonus !' });
          }
        }

        localStorage.setItem('kwenda_login_intent', 'client');
        localStorage.setItem('kwenda_selected_role', 'client');

        if (!authData.session) {
          toast({ title: t('auth.verify_email'), description: t('auth.confirmation_email_sent') });
        } else {
          toast({ title: t('common.success'), description: t('auth.client_account_created') });
        }
        onSuccess();
      }
    } catch (error: any) {
      logger.error('Client registration error', error);
      toast({ title: t('common.error'), description: error.message || t('auth.registration_error'), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white dark:from-background dark:via-background dark:to-background flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl animate-auth-fade">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-100 dark:border-border">
              <BrandLogo size={48} />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.client_registration')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('auth.client_registration_subtitle')}</p>
          </div>
        </div>

        {/* Registration Card */}
        <Card className="bg-white dark:bg-card shadow-sm border border-gray-100 dark:border-border rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section: Identifiants */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-rose-500" />
                  Identifiants de connexion
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-gray-600 dark:text-gray-300">{t('auth.email_required')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11 bg-white dark:bg-input border-gray-200 dark:border-border rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {t('auth.phone_required')}
                    </Label>
                    <div className="relative">
                      <Input
                        id="phoneNumber"
                        type="tel"
                        inputMode="tel"
                        placeholder={t('auth.phone_placeholder')}
                        value={formData.phoneNumber}
                        onChange={(e) => {
                          setFormData({ ...formData, phoneNumber: e.target.value });
                          setPhoneValid(validatePhoneNumber(e.target.value));
                        }}
                        className={cn(
                          "h-11 pr-10 bg-white dark:bg-input border-gray-200 dark:border-border rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20",
                          phoneValid && "border-green-400 focus:border-green-400"
                        )}
                        required
                      />
                      {phoneValid && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-gray-600 dark:text-gray-300">{t('auth.password_required')}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-11 bg-white dark:bg-input border-gray-200 dark:border-border rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm text-gray-600 dark:text-gray-300">{t('auth.confirm_password_required')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="h-11 bg-white dark:bg-input border-gray-200 dark:border-border rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Informations personnelles */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-border">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-rose-500" />
                  Informations personnelles
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm text-gray-600 dark:text-gray-300">{t('auth.full_name_required')}</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                    className="h-11 bg-white dark:bg-input border-gray-200 dark:border-border rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm text-gray-600 dark:text-gray-300">{t('auth.date_of_birth')}</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="h-11 bg-white dark:bg-input border-gray-200 dark:border-border rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm text-gray-600 dark:text-gray-300">{t('auth.gender')}</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger className="h-11 bg-white dark:bg-input border-gray-200 dark:border-border rounded-xl">
                        <SelectValue placeholder={t('auth.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('auth.male')}</SelectItem>
                        <SelectItem value="female">{t('auth.female')}</SelectItem>
                        <SelectItem value="other">{t('auth.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm text-gray-600 dark:text-gray-300">{t('auth.address')}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-11 bg-white dark:bg-input border-gray-200 dark:border-border rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Section: Contact d'urgence */}
              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-border">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-rose-500" />
                  Contact d'urgence (optionnel)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName" className="text-sm text-gray-600 dark:text-gray-300">{t('auth.emergency_contact_name')}</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      className="h-11 bg-white dark:bg-input border-gray-200 dark:border-border rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone" className="text-sm text-gray-600 dark:text-gray-300">{t('auth.emergency_contact_phone')}</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      className="h-11 bg-white dark:bg-input border-gray-200 dark:border-border rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Code parrainage avec validation temps réel */}
              <div className={cn(
                "space-y-3 p-4 rounded-xl border transition-all",
                referralValidation?.valid 
                  ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30"
                  : referralValidation?.valid === false
                    ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30"
                    : "bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/30"
              )}>
                <Label htmlFor="referralCode" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-rose-500" />
                  Code de parrainage (optionnel)
                </Label>
                <div className="relative">
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Ex: KWENDA2024"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                    className={cn(
                      "h-11 uppercase bg-white dark:bg-input rounded-xl pr-10",
                      referralValidation?.valid 
                        ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-500/20"
                        : referralValidation?.valid === false
                          ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                          : "border-gray-200 dark:border-border focus:border-rose-400 focus:ring-rose-500/20"
                    )}
                  />
                  {validatingCode && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                  {!validatingCode && referralValidation?.valid && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                  {!validatingCode && referralValidation?.valid === false && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  )}
                </div>
                
                {/* Feedback de validation */}
                {referralValidation?.valid && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-300">
                      Code de <strong>{referralValidation.referrer_name}</strong> valide ! Vous recevrez {referralValidation.reward_amount || 500} CDF 🎁
                    </span>
                  </div>
                )}
                {referralValidation?.valid === false && (
                  <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    {referralValidation.limit_reached ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {referralValidation.message || 'Code invalide'}
                    </span>
                  </div>
                )}
                {!referralValidation && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Entrez le code d'un ami pour recevoir 500 CDF de bonus !
                  </p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-full-register"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                  className="mt-0.5 flex-shrink-0 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                />
                <Label htmlFor="terms-full-register" className="text-xs text-muted-foreground cursor-pointer leading-snug">
                  J'accepte les{' '}
                  <button type="button" onClick={() => setLegalSheet('terms')} className="text-rose-500 font-medium hover:underline">
                    conditions générales d'utilisation
                  </button>{' '}
                  et la{' '}
                  <button type="button" onClick={() => setLegalSheet('privacy')} className="text-rose-500 font-medium hover:underline">
                    politique de confidentialité
                  </button>{' '}
                  de TAGA.
                </Label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-11 rounded-xl border-gray-200 dark:border-border">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('common.back')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !formData.acceptTerms} 
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-medium shadow-sm"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.create_account')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <LegalDocumentSheet type={legalSheet} open={!!legalSheet} onOpenChange={(open) => !open && setLegalSheet(null)} />
    </div>
  );
};
