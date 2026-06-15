import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, IdCard, Calendar, Upload, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LicenseStepProps {
  formData: {
    licenseNumber: string;
    licenseExpiry: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export const LicenseStep: React.FC<LicenseStepProps> = ({
  formData,
  onFieldChange
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
          <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-base">Documents</h3>
          <p className="text-xs text-muted-foreground">Permis et informations légales</p>
        </div>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          Le permis de conduire est <strong>recommandé</strong> mais peut être ajouté ultérieurement depuis votre espace chauffeur.
        </p>
      </div>

      {/* Permis fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <IdCard className="w-3.5 h-3.5 text-amber-500" />
            Numéro de permis
          </Label>
          <Input
            value={formData.licenseNumber}
            onChange={(e) => onFieldChange('licenseNumber', e.target.value)}
            placeholder="Ex: ABC123456"
            className="h-12 rounded-xl border-border/60 bg-muted/30 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            Date d'expiration
          </Label>
          <Input
            type="date"
            value={formData.licenseExpiry}
            onChange={(e) => onFieldChange('licenseExpiry', e.target.value)}
            className="h-12 rounded-xl border-border/60 bg-muted/30 transition-all"
          />
        </div>
      </div>

      {/* Upload zone */}
      <div className="border-2 border-dashed border-border/50 rounded-2xl p-6 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-200 cursor-pointer group">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-muted/50 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/30 flex items-center justify-center mx-auto transition-colors">
            <Upload className="w-5 h-5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
          </div>
          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Photo de votre permis
            <span className="text-[10px] ml-1 font-normal">(optionnel)</span>
          </p>
          <p className="text-[10px] text-muted-foreground">JPG, PNG — max 5 MB</p>
        </div>
      </div>

      {/* Contact d'urgence */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-2 pb-1">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground px-2">Contact d'urgence</span>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nom <span className="font-normal normal-case">(optionnel)</span>
            </Label>
            <Input
              value={formData.emergencyContactName}
              onChange={(e) => onFieldChange('emergencyContactName', e.target.value)}
              placeholder="Prénom Nom"
              className="h-12 rounded-xl border-border/60 bg-muted/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Téléphone <span className="font-normal normal-case">(optionnel)</span>
            </Label>
            <Input
              value={formData.emergencyContactPhone}
              onChange={(e) => onFieldChange('emergencyContactPhone', e.target.value)}
              placeholder="+243 999 000 000"
              className="h-12 rounded-xl border-border/60 bg-muted/30"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
