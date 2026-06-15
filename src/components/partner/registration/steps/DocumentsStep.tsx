import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { documentsSchema, DocumentsFormData } from '@/schemas/partnerRegistration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, ChevronLeft, ChevronRight, Info, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DocumentsStepProps {
  data: DocumentsFormData;
  onNext: (data: DocumentsFormData) => void;
  onPrevious: () => void;
  partnerType?: 'delivery' | 'auto';
  theme?: any;
}

export const DocumentsStep = ({ data, onNext, onPrevious, partnerType, theme }: DocumentsStepProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentsFormData>({
    resolver: zodResolver(documentsSchema),
    defaultValues: data,
  });

  const onSubmit = (formData: DocumentsFormData) => {
    onNext(formData);
  };

  const iconColor = partnerType === 'auto' ? 'text-blue-500' : partnerType === 'delivery' ? 'text-orange-500' : 'text-emerald-500';
  const infoBg = partnerType === 'auto' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/40' :
                 partnerType === 'delivery' ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200/60 dark:border-orange-800/40' :
                 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center',
          partnerType === 'auto' ? 'bg-blue-100 dark:bg-blue-950/40' :
          partnerType === 'delivery' ? 'bg-orange-100 dark:bg-orange-950/40' :
          'bg-emerald-100 dark:bg-emerald-950/40'
        )}>
          <FileText className={cn('w-5 h-5', iconColor)} />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-base">Documents fiscaux</h3>
          <p className="text-xs text-muted-foreground">Optionnel — accélère la validation</p>
        </div>
      </div>

      {/* Info card */}
      <div className={cn('flex items-start gap-3 p-4 rounded-2xl border', infoBg)}>
        <Info className={cn('w-4 h-4 mt-0.5 shrink-0', iconColor)} />
        <p className="text-xs text-foreground/80 leading-relaxed">
          Cette information est <strong>optionnelle</strong> mais fortement recommandée pour accélérer la validation de votre compte partenaire.
        </p>
      </div>

      {/* Numéro fiscal */}
      <div className="space-y-1.5">
        <Label htmlFor="tax_number" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Numéro d'identification fiscale
        </Label>
        <Input
          id="tax_number"
          {...register('tax_number')}
          placeholder="Ex: NIF A1234567X ou RCCM CD/KIN/12345"
          className={cn(
            'h-12 rounded-xl border-border/60 bg-muted/30 transition-all',
            errors.tax_number ? 'border-destructive' : ''
          )}
        />
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" />
          Votre NIF (Numéro d'Identification Fiscale) ou RCCM (Registre de Commerce)
        </p>
        {errors.tax_number && (
          <p className="text-xs text-destructive">{errors.tax_number.message}</p>
        )}
      </div>

      {/* Second info card */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/40 bg-muted/20">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Vous pourrez ajouter d'autres documents (licence commerciale, attestations, etc.) après validation depuis votre espace partenaire.
        </p>
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
          className={cn('flex-1 h-12 rounded-xl font-semibold text-white', theme?.btnClass)}
        >
          Continuer
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
};
