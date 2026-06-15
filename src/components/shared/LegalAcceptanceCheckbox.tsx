import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LegalDocumentSheet } from '@/components/shared/LegalDocumentSheet';
import { cn } from '@/lib/utils';

interface LegalAcceptanceCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  accentColor?: 'red' | 'amber' | 'blue' | 'orange' | 'emerald';
  showDataProcessing?: boolean;
  dataProcessingChecked?: boolean;
  onDataProcessingChange?: (checked: boolean) => void;
  className?: string;
}

const accentStyles = {
  red: {
    link: 'text-red-600 dark:text-red-400',
    checkbox: 'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600',
  },
  amber: {
    link: 'text-amber-600 dark:text-amber-400',
    checkbox: 'data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500',
  },
  blue: {
    link: 'text-blue-600 dark:text-blue-400',
    checkbox: 'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600',
  },
  orange: {
    link: 'text-orange-600 dark:text-orange-400',
    checkbox: 'data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500',
  },
  emerald: {
    link: 'text-emerald-600 dark:text-emerald-400',
    checkbox: 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500',
  },
};

export const LegalAcceptanceCheckbox = ({
  checked,
  onCheckedChange,
  id = 'accept-terms',
  accentColor = 'amber',
  showDataProcessing = false,
  dataProcessingChecked = false,
  onDataProcessingChange,
  className,
}: LegalAcceptanceCheckboxProps) => {
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);
  const styles = accentStyles[accentColor];

  return (
    <>
      <div className={cn('space-y-3 p-2 bg-muted/30 rounded-xl border border-border/30', className)}>
        <div className="flex items-start gap-3">
          <Checkbox
            id={id}
            checked={checked}
            onCheckedChange={(val) => onCheckedChange(val as boolean)}
            className={cn('mt-0.5 shrink-0', styles.checkbox)}
          />
          <Label
            htmlFor={id}
            className="text-xs text-muted-foreground cursor-pointer leading-tight"
          >
            J'accepte les{' '}
            <span
              onClick={() => setLegalSheet('terms')}
              style={{ display: 'inline' }}
              className={cn('font-semibold hover:underline cursor-pointer', styles.link)}
            >
              conditions d'utilisation
            </span>{' '}
            et la{' '}
            <span
              onClick={() => setLegalSheet('privacy')}
              style={{ display: 'inline' }}
              className={cn('font-semibold hover:underline cursor-pointer', styles.link)}
            >
              politique de confidentialité
            </span>{' '}
            de Tembea.
          </Label>
        </div>

        {showDataProcessing && onDataProcessingChange && (
          <div className="flex items-start gap-3 pt-1 border-t border-border/20">
            <Checkbox
              id={`${id}-data`}
              checked={dataProcessingChecked}
              onCheckedChange={(val) => onDataProcessingChange(val as boolean)}
              className={cn('mt-0.5 shrink-0', styles.checkbox)}
            />
            <Label
              htmlFor={`${id}-data`}
              className="text-xs text-muted-foreground cursor-pointer leading-tight"
            >
              J'autorise le traitement de mes données personnelles pour la vérification de mon profil.
            </Label>
          </div>
        )}
      </div>

      <LegalDocumentSheet
        type={legalSheet}
        open={!!legalSheet}
        onOpenChange={(open) => !open && setLegalSheet(null)}
      />
    </>
  );
};
