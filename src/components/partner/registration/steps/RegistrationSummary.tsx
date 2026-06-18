import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, MapPin, FileText, Edit2, CheckCircle, ChevronLeft, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { CompanyInfoFormData, DocumentsFormData, ServicesFormData, SecurityFormData } from '@/schemas/partnerRegistration';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LegalDocumentSheet } from '@/components/shared/LegalDocumentSheet';

interface RegistrationSummaryProps {
  data: CompanyInfoFormData & DocumentsFormData & ServicesFormData & Partial<SecurityFormData> & { partner_type?: 'delivery' | 'auto' };
  onConfirm: () => void;
  onEdit: (step: number) => void;
  onPrevious: () => void;
  loading: boolean;
  partnerType?: 'delivery' | 'auto';
  theme?: any;
}

const CITIES_FLAGS: Record<string, string> = {
  Kinshasa: '🇨🇩',
  Lubumbashi: '🇨🇩',
  Kolwezi: '🇨🇩',
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  individual: 'Entreprise individuelle',
  company: 'Société',
  cooperative: 'Coopérative',
  association: 'Association',
};

export const RegistrationSummary = ({ data, onConfirm, onEdit, onPrevious, loading, partnerType, theme }: RegistrationSummaryProps) => {
  const [legalSheet, setLegalSheet] = useState<'terms' | 'privacy' | null>(null);
  const iconColor = partnerType === 'auto' ? 'text-blue-500' : partnerType === 'delivery' ? 'text-orange-500' : 'text-emerald-500';
  const editColor = partnerType === 'auto' ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30' :
                   partnerType === 'delivery' ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30' :
                   'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30';
  const badgeBg = partnerType === 'auto' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' :
                  partnerType === 'delivery' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300' :
                  'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
  const headerBg = partnerType === 'auto' ? 'from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30' :
                   partnerType === 'delivery' ? 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30' :
                   'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30';

  return (
    <div className="space-y-4">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('p-5 rounded-2xl bg-gradient-to-br text-center', headerBg)}
      >
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3',
          partnerType === 'auto' ? 'bg-blue-100 dark:bg-blue-950/50' :
          partnerType === 'delivery' ? 'bg-orange-100 dark:bg-orange-950/50' :
          'bg-emerald-100 dark:bg-emerald-950/50'
        )}>
          <ShieldCheck className={cn('w-6 h-6', iconColor)} />
        </div>
        <h3 className="font-bold text-foreground text-base mb-1">Tout est prêt !</h3>
        <p className="text-xs text-muted-foreground mb-3">Vérifiez vos informations avant de valider</p>
        {(partnerType === 'delivery' || partnerType === 'auto') && (
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full', badgeBg)}>
            {partnerType === 'delivery' ? '🚚 Partenaire Delivery' : '🚗 Partenaire Auto'}
          </span>
        )}
      </motion.div>

      {/* Section: Entreprise */}
      <SummaryCard
        icon={<Building2 className={cn('w-4 h-4', iconColor)} />}
        title="Entreprise"
        onEdit={() => onEdit(1)}
        editColor={editColor}
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <SummaryItem label="Nom" value={data.company_name} />
          <SummaryItem label="Type" value={BUSINESS_TYPE_LABELS[data.business_type] || data.business_type} badge />
          <SummaryItem label="Email" value={data.contact_email} icon={<Mail className="w-3 h-3" />} />
          <SummaryItem label="Téléphone" value={data.phone} icon={<Phone className="w-3 h-3" />} />
          {data.address && (
            <div className="col-span-2">
              <SummaryItem label="Adresse" value={data.address} icon={<MapPin className="w-3 h-3" />} />
            </div>
          )}
        </div>
      </SummaryCard>

      {/* Section: Documents */}
      {data.tax_number && (
        <SummaryCard
          icon={<FileText className={cn('w-4 h-4', iconColor)} />}
          title="Document fiscal"
          onEdit={() => onEdit(2)}
          editColor={editColor}
        >
          <SummaryItem label="Numéro fiscal" value={data.tax_number} />
        </SummaryCard>
      )}

      {/* Section: Zones */}
      <SummaryCard
        icon={<MapPin className={cn('w-4 h-4', iconColor)} />}
        title="Zones de service"
        onEdit={() => onEdit(3)}
        editColor={editColor}
      >
        <div className="flex flex-wrap gap-1.5">
          {data.service_areas?.map((area) => (
            <span key={area} className={cn('inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', badgeBg)}>
              {CITIES_FLAGS[area] || '🌍'} {area}
            </span>
          ))}
        </div>
      </SummaryCard>

      {/* Section: Sécurité */}
      <SummaryCard
        icon={<Lock className={cn('w-4 h-4', iconColor)} />}
        title="Sécurité"
        onEdit={() => onEdit(4)}
        editColor={editColor}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Mot de passe défini</span>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
        </div>
      </SummaryCard>

      {/* CGU */}
      <div className="p-4 rounded-2xl border border-border/40 bg-muted/20">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          En validant votre inscription, vous acceptez les{' '}
          <button type="button" onClick={() => setLegalSheet('terms')} className={cn('font-medium hover:underline', iconColor)}>conditions d'utilisation</button>
          {' '}et la{' '}
          <button type="button" onClick={() => setLegalSheet('privacy')} className={cn('font-medium hover:underline', iconColor)}>politique de confidentialité</button>
          {' '}de TAGA.
        </p>
        <LegalDocumentSheet
          type={legalSheet}
          open={!!legalSheet}
          onOpenChange={(open) => !open && setLegalSheet(null)}
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={loading}
          className="h-12 px-5 rounded-xl border-border/60"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={cn('flex-1 h-12 rounded-xl font-semibold text-white', theme?.btnClass)}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Inscription en cours...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Valider mon inscription
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Sub-components
const SummaryCard = ({ icon, title, onEdit, editColor, children }: {
  icon: React.ReactNode;
  title: string;
  onEdit: () => void;
  editColor: string;
  children: React.ReactNode;
}) => (
  <div className="border border-border/40 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/30">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors', editColor)}
      >
        <Edit2 className="w-3 h-3" />
        Modifier
      </button>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const SummaryItem = ({ label, value, icon, badge }: { label: string; value: string; icon?: React.ReactNode; badge?: boolean }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
    {badge ? (
      <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-foreground">{value}</span>
    ) : (
      <p className="text-sm font-medium text-foreground flex items-center gap-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {value}
      </p>
    )}
  </div>
);
