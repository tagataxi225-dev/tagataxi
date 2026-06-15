import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { securitySchema, SecurityFormData } from '@/schemas/partnerRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, ChevronLeft, ChevronRight, Shield, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SecurityStepProps {
  data: SecurityFormData;
  onNext: (data: SecurityFormData) => void;
  onPrevious: () => void;
  partnerType?: 'delivery' | 'auto';
  theme?: any;
  showPasswordResetLink?: boolean;
}

const getStrengthLevel = (met: number) => {
  if (met === 0) return { level: 0, label: '', color: '' };
  if (met === 1) return { level: 1, label: 'Très faible', color: 'bg-red-500' };
  if (met === 2) return { level: 2, label: 'Faible', color: 'bg-orange-500' };
  if (met === 3) return { level: 3, label: 'Moyen', color: 'bg-yellow-500' };
  return { level: 4, label: 'Fort', color: 'bg-emerald-500' };
};

export const SecurityStep = ({ data, onNext, onPrevious, partnerType, theme, showPasswordResetLink }: SecurityStepProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: data,
  });

  const password = watch('password', '');

  const passwordCriteria = [
    { label: 'Au moins 8 caractères', met: password.length >= 8 },
    { label: 'Une majuscule (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Une minuscule (a-z)', met: /[a-z]/.test(password) },
    { label: 'Un chiffre (0-9)', met: /[0-9]/.test(password) },
  ];

  const metCount = passwordCriteria.filter(c => c.met).length;
  const strength = getStrengthLevel(password ? metCount : 0);
  const allCriteriaMet = metCount === 4;

  const iconColor = partnerType === 'auto' ? 'text-blue-500' : partnerType === 'delivery' ? 'text-orange-500' : 'text-emerald-500';
  const infoBg = partnerType === 'auto' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/40' :
                 partnerType === 'delivery' ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200/60 dark:border-orange-800/40' :
                 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40';

  const onSubmit = (formData: SecurityFormData) => {
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center',
          partnerType === 'auto' ? 'bg-blue-100 dark:bg-blue-950/40' :
          partnerType === 'delivery' ? 'bg-orange-100 dark:bg-orange-950/40' :
          'bg-emerald-100 dark:bg-emerald-950/40'
        )}>
          <Shield className={cn('w-5 h-5', iconColor)} />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-base">Sécurisez votre compte</h3>
          <p className="text-xs text-muted-foreground">Choisissez un mot de passe robuste</p>
        </div>
      </div>

      {/* Info */}
      <div className={cn('flex items-start gap-3 p-4 rounded-2xl border', infoBg)}>
        <Shield className={cn('w-4 h-4 mt-0.5 shrink-0', iconColor)} />
        <p className="text-xs text-foreground/80 leading-relaxed">
          Créez un mot de passe fort pour protéger votre espace partenaire et vos données financières.
        </p>
      </div>

      {/* Mot de passe */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Lock className={cn('w-3.5 h-3.5', iconColor)} />
          Mot de passe *
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="••••••••"
            className={cn(
              'h-12 rounded-xl border-border/60 bg-muted/30 pr-12 transition-all',
              errors.password ? 'border-destructive' : ''
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Password strength */}
      <AnimatePresence>
        {password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Strength bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Force</span>
                <span className={cn('text-xs font-semibold', strength.level >= 4 ? 'text-emerald-600' : strength.level >= 3 ? 'text-yellow-600' : 'text-orange-600')}>
                  {strength.label}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-all duration-300',
                      strength.level >= i ? strength.color : 'bg-muted'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Criteria */}
            <div className="grid grid-cols-2 gap-1.5">
              {passwordCriteria.map((criteria, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className={cn(
                    'w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all',
                    criteria.met ? 'bg-emerald-500' : 'bg-muted'
                  )}>
                    {criteria.met ? (
                      <Check className="w-2 h-2 text-white" />
                    ) : (
                      <X className="w-2 h-2 text-muted-foreground" />
                    )}
                  </div>
                  <span className={cn('text-[10px]', criteria.met ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground')}>
                    {criteria.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Lock className={cn('w-3.5 h-3.5', iconColor)} />
          Confirmer le mot de passe *
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            placeholder="••••••••"
            className={cn(
              'h-12 rounded-xl border-border/60 bg-muted/30 pr-12 transition-all',
              errors.confirmPassword ? 'border-destructive' : ''
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="flex-1 h-12 rounded-xl border-border/60"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button
          type="submit"
          disabled={!allCriteriaMet}
          className={cn('flex-1 h-12 rounded-xl font-semibold text-white', theme?.btnClass)}
        >
          Continuer
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {showPasswordResetLink && (
        <div className="text-center mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <p className="text-xs text-amber-800 dark:text-amber-200 mb-1">Mot de passe oublié ?</p>
          <a href="/auth/reset-password" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Réinitialisez-le ici
          </a>
        </div>
      )}
    </form>
  );
};
