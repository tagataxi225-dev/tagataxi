import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyInfoSchema, CompanyInfoFormData } from '@/schemas/partnerRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Mail, Phone, MapPin, ChevronRight, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CompanyInfoStepProps {
  data: CompanyInfoFormData;
  onNext: (data: CompanyInfoFormData) => void;
  partnerType?: 'delivery' | 'auto';
  theme?: any;
}

const BUSINESS_TYPES = [
  { value: 'individual', label: 'Entreprise individuelle' },
  { value: 'company', label: 'Société (SARL, SA, etc.)' },
  { value: 'cooperative', label: 'Coopérative' },
  { value: 'association', label: 'Association' },
];

export const CompanyInfoStep = ({ data, onNext, partnerType, theme }: CompanyInfoStepProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyInfoFormData>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: data,
  });

  const business_type = watch('business_type');
  const [phoneValue, setPhoneValue] = useState(data.phone || '');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9+]/g, '');
    if (value.startsWith('0') && value.length > 1) {
      value = '+243' + value.substring(1);
    }
    if (value.match(/^[1-9]/) && !value.startsWith('+')) {
      value = '+243' + value;
    }
    setPhoneValue(value);
    setValue('phone', value);
  };

  const onSubmit = (formData: CompanyInfoFormData) => {
    onNext(formData);
  };

  const iconColor = partnerType === 'auto' ? 'text-blue-500' : partnerType === 'delivery' ? 'text-orange-500' : 'text-emerald-500';
  const inputFocus = partnerType === 'auto' ? 'focus-within:border-blue-400' : partnerType === 'delivery' ? 'focus-within:border-orange-400' : 'focus-within:border-emerald-400';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center',
          partnerType === 'auto' ? 'bg-blue-100 dark:bg-blue-950/40' :
          partnerType === 'delivery' ? 'bg-orange-100 dark:bg-orange-950/40' :
          'bg-emerald-100 dark:bg-emerald-950/40'
        )}>
          <Building2 className={cn('w-5 h-5', iconColor)} />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-base">Votre entreprise</h3>
          <p className="text-xs text-muted-foreground">Informations légales de votre société</p>
        </div>
      </div>

      {/* Row 1: Nom + Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="company_name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Nom de l'entreprise *
          </Label>
          <Input
            id="company_name"
            {...register('company_name')}
            placeholder="Ex: Transport Express SA"
            className={cn(
              'h-12 rounded-xl border-border/60 bg-muted/30 transition-all duration-200',
              errors.company_name ? 'border-destructive' : inputFocus,
            )}
          />
          <AnimatePresence>
            {errors.company_name && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />{errors.company_name.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Type d'entreprise *
          </Label>
          <Select value={business_type} onValueChange={(v) => setValue('business_type', v as any)}>
            <SelectTrigger className={cn(
              'h-12 rounded-xl border-border/60 bg-muted/30 transition-all',
              errors.business_type ? 'border-destructive' : ''
            )}>
              <SelectValue placeholder="Sélectionnez un type" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map(bt => (
                <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AnimatePresence>
            {errors.business_type && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.business_type.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Row 2: Email */}
      <div className="space-y-1.5">
        <Label htmlFor="contact_email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Mail className={cn('w-3.5 h-3.5', iconColor)} />
          Email professionnel *
        </Label>
        <Input
          id="contact_email"
          type="email"
          {...register('contact_email')}
          placeholder="contact@entreprise.com"
          className={cn(
            'h-12 rounded-xl border-border/60 bg-muted/30 transition-all',
            errors.contact_email ? 'border-destructive' : inputFocus
          )}
        />
        <AnimatePresence>
          {errors.contact_email && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{errors.contact_email.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Row 3: Tel + Adresse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Phone className={cn('w-3.5 h-3.5', iconColor)} />
            Téléphone *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phoneValue}
            onChange={handlePhoneChange}
            placeholder="+243 999 000 000"
            className={cn(
              'h-12 rounded-xl border-border/60 bg-muted/30 transition-all',
              errors.phone ? 'border-destructive' : inputFocus
            )}
          />
          <AnimatePresence>
            {errors.phone ? (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.phone.message}
              </motion.p>
            ) : (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />Format: +243971508000 ou 0971508000
              </p>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <MapPin className={cn('w-3.5 h-3.5', iconColor)} />
            Adresse <span className="font-normal normal-case">(optionnel)</span>
          </Label>
          <Textarea
            id="address"
            {...register('address')}
            placeholder="Ex: Avenue de la Paix, Kinshasa"
            rows={2}
            className={cn(
              'rounded-xl border-border/60 bg-muted/30 resize-none transition-all text-sm',
              errors.address ? 'border-destructive' : inputFocus
            )}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="pt-2">
        <Button
          type="submit"
          className={cn('w-full h-12 rounded-xl font-semibold text-white transition-all duration-200', theme?.btnClass)}
        >
          Continuer
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};
